import { browser } from '#imports'
import type { TimerMessage, TimerResponse } from '@/shared/messages'
import { clampMinutes, createDefaultState, formatDuration, type TimerState } from '@/shared/timer'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

type TimerAction = (message: TimerMessage) => void

const sendMessage: TimerAction = (message) => {
  browser.runtime.sendMessage(message, () => void 0)
}

const requestState = (): Promise<TimerState> =>
  new Promise((resolve) => {
    browser.runtime.sendMessage({ type: 'GET_STATE' }, (response: TimerResponse) =>
      resolve(response?.state ?? createDefaultState()),
    )
  })

function useTimerState() {
  const [state, setState] = useState<TimerState>(createDefaultState())
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    requestState().then(setState)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleChange = (changes: Record<string, any>, area: string) => {
      if (area !== 'local' || !changes.timerState?.newValue) return
      setState(changes.timerState.newValue)
    }
    browser.storage.onChanged.addListener(handleChange)
    return () => browser.storage.onChanged.removeListener(handleChange)
  }, [])

  return { state, now }
}

function App() {
  const { state, now } = useTimerState()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [workMinutes, setWorkMinutes] = useState(state.custom.work)
  const [breakMinutes, setBreakMinutes] = useState(state.custom.break)

  useEffect(() => {
    setWorkMinutes(state.custom.work)
    setBreakMinutes(state.custom.break)
  }, [state.custom.work, state.custom.break])

  const remainingMs = useMemo(() => {
    if (state.status === 'running' && state.endAt) {
      return Math.max(0, state.endAt - now)
    }
    if (state.status === 'paused' && state.remainingMs !== null) {
      return state.remainingMs
    }
    return state.durationMs
  }, [state, now])

  const startStopLabel = state.status === 'idle' ? 'Start' : 'Stop'
  const pauseResumeLabel = state.status === 'paused' ? 'Resume' : 'Pause'
  const isRunning = state.status === 'running'
  const themeClass = state.mode === 'break' ? 'theme-break' : 'theme-work'

  const handleStartStop = () => {
    if (state.status === 'idle') {
      sendMessage({
        type: 'START',
        payload: {
          work: clampMinutes(state.custom.work),
          break: clampMinutes(state.custom.break),
        },
      })
      return
    }
    sendMessage({ type: 'RESET' })
  }

  const handlePauseResume = () => {
    if (state.status === 'running') {
      sendMessage({ type: 'PAUSE' })
      return
    }
    if (state.status === 'paused') {
      sendMessage({ type: 'RESUME' })
    }
  }

  const handleSaveSettings = () => {
    sendMessage({
      type: 'SET_CUSTOM',
      payload: {
        work: clampMinutes(workMinutes),
        break: clampMinutes(breakMinutes),
      },
    })
    setSettingsOpen(false)
  }

  const handleSoundToggle = (event: ChangeEvent<HTMLInputElement>) => {
    sendMessage({
      type: 'SET_SOUND',
      payload: { enabled: event.target.checked },
    })
  }

  const handleNotificationsToggle = (event: ChangeEvent<HTMLInputElement>) => {
    sendMessage({
      type: 'SET_NOTIFICATIONS',
      payload: { enabled: event.target.checked },
    })
  }

  return (
    <main
      className={`cyberpunk-root cyberpunk-bg relative flex min-h-80 w-80 flex-col overflow-hidden px-4 py-4 text-(--text-primary) shadow-[0_22px_50px_rgba(var(--accent-rgb),0.24)] ${themeClass}`}
    >
      <div className="cyberpunk-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.32em] text-(--text-muted) uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-(--accent-200) shadow-[0_0_6px_rgba(var(--accent-rgb),0.8)]" />
            Tomato
          </div>
          <button
            type="button"
            aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
            onClick={() => setSettingsOpen((open) => !open)}
            className="rounded-md border border-[rgba(var(--accent-rgb),0.4)] bg-[rgba(var(--panel-rgb),0.7)] p-2 text-(--text-soft) transition hover:bg-[rgb(var(--panel-strong-rgb))] hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.35)]"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
              <path d="M3 5.5h14a1 1 0 1 0 0-2H3a1 1 0 0 0 0 2Zm0 5h14a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2Zm0 5h14a1 1 0 1 0 0-2H3a1 1 0 0 0 0 2Z" />
            </svg>
          </button>
        </header>

        <div className="relative mt-3 flex-1 overflow-hidden">
          <div
            className={`flex w-[200%] transition-transform duration-300 ease-out ${
              settingsOpen ? '-translate-x-1/2' : 'translate-x-0'
            }`}
          >
            <section
              aria-hidden={settingsOpen}
              className={`flex w-1/2 flex-col gap-4 ${settingsOpen ? 'pointer-events-none' : ''}`}
            >
              <div className="holo-card holo-corners relative rounded-2xl p-4 text-center">
                <div
                  className={`neon-text text-6xl leading-none font-semibold tracking-[0.08em] tabular-nums ${
                    isRunning ? 'animate-glow animate-glitch' : ''
                  }`}
                >
                  {formatDuration(remainingMs)}
                </div>
              </div>

              <div className="mt-auto grid gap-3">
                <button
                  className="group neon-primary relative rounded-xl px-3 py-2 font-semibold text-[rgb(var(--panel-strong-rgb))] transition hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(var(--accent-rgb),0.35)]"
                  onClick={handleStartStop}
                >
                  <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(120deg,transparent,rgba(var(--glint-rgb),0.65),transparent)] opacity-0 transition duration-700 group-hover:translate-x-full group-hover:opacity-100" />
                  <span className="relative z-10">{startStopLabel}</span>
                </button>
                <button
                  className="group neon-secondary relative rounded-xl px-3 py-2 font-semibold text-(--text-soft-strong) transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(var(--accent-rgb),0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handlePauseResume}
                  disabled={state.status === 'idle'}
                >
                  <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(120deg,transparent,rgba(var(--accent-rgb),0.35),transparent)] opacity-0 transition duration-700 group-hover:translate-x-full group-hover:opacity-100" />
                  <span className="relative z-10">{pauseResumeLabel}</span>
                </button>
              </div>
            </section>

            <section
              aria-hidden={!settingsOpen}
              className={`flex w-1/2 flex-col gap-3 ${settingsOpen ? '' : 'pointer-events-none'}`}
            >
              <div className="text-[10px] tracking-[0.32em] text-(--text-subtle) uppercase">
                Settings
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 pr-2">
                <div className="grid gap-1.5">
                  <label
                    htmlFor="workMinutes"
                    className="text-[10px] tracking-[0.18em] text-(--text-subtle-muted) uppercase"
                  >
                    Work minutes
                  </label>
                  <input
                    id="workMinutes"
                    type="number"
                    min={1}
                    max={180}
                    value={workMinutes}
                    onChange={(event) => setWorkMinutes(event.target.valueAsNumber)}
                    className="neon-input w-full rounded-lg px-3 py-1.5 text-xs text-(--text-primary) focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.6)] focus-visible:outline-none"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label
                    htmlFor="breakMinutes"
                    className="text-[10px] tracking-[0.18em] text-(--text-subtle-muted) uppercase"
                  >
                    Break minutes
                  </label>
                  <input
                    id="breakMinutes"
                    type="number"
                    min={1}
                    max={180}
                    value={breakMinutes}
                    onChange={(event) => setBreakMinutes(event.target.valueAsNumber)}
                    className="neon-input w-full rounded-lg px-3 py-1.5 text-xs text-(--text-primary) focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.6)] focus-visible:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-(--text-soft)">
                  <div className="flex items-center gap-2">
                    <label htmlFor="spellSound" className="cursor-pointer">
                      Spell sound
                    </label>
                    <button
                      type="button"
                      aria-label="Play sound preview"
                      className="rounded-md border border-[rgba(var(--accent-rgb),0.4)] bg-[rgba(var(--panel-rgb),0.7)] p-1.5 text-(--text-soft) transition hover:bg-[rgb(var(--panel-strong-rgb))] hover:shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]"
                      onClick={() => sendMessage({ type: 'PLAY_SOUND' })}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5">
                        <path
                          fill="currentColor"
                          d="M11.5 3.75a.75.75 0 0 1 .75.75v11a.75.75 0 0 1-1.28.53L7.94 13.5H5.5A1.5 1.5 0 0 1 4 12V8a1.5 1.5 0 0 1 1.5-1.5h2.44l3.03-3.03a.75.75 0 0 1 .53-.22Zm3.63 2.37a.75.75 0 0 1 1.06 0 4.75 4.75 0 0 1 0 6.72.75.75 0 0 1-1.06-1.06 3.25 3.25 0 0 0 0-4.6.75.75 0 0 1 0-1.06ZM13.86 7.36a.75.75 0 0 1 1.06 0 2.25 2.25 0 0 1 0 3.18.75.75 0 0 1-1.06-1.06.75.75 0 0 0 0-1.06.75.75 0 0 1 0-1.06Z"
                        />
                      </svg>
                    </button>
                  </div>
                  <label
                    htmlFor="spellSound"
                    className="relative inline-flex cursor-pointer items-center"
                  >
                    <input
                      id="spellSound"
                      type="checkbox"
                      checked={state.soundEnabled}
                      onChange={handleSoundToggle}
                      className="peer sr-only"
                    />
                    <span className="neon-toggle h-4 w-8 rounded-full transition peer-checked:bg-[rgba(var(--accent-rgb),0.6)]" />
                    <span className="absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-(--toggle-knob) transition peer-checked:translate-x-4 peer-checked:bg-(--toggle-knob-active)" />
                  </label>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-(--text-soft)">
                  <label htmlFor="notificationsToggle" className="cursor-pointer">
                    Notifications
                  </label>
                  <label
                    htmlFor="notificationsToggle"
                    className="relative inline-flex cursor-pointer items-center"
                  >
                    <input
                      id="notificationsToggle"
                      type="checkbox"
                      checked={state.notificationsEnabled}
                      onChange={handleNotificationsToggle}
                      className="peer sr-only"
                    />
                    <span className="neon-toggle h-4 w-8 rounded-full transition peer-checked:bg-[rgba(var(--accent-rgb),0.6)]" />
                    <span className="absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-(--toggle-knob) transition peer-checked:translate-x-4 peer-checked:bg-(--toggle-knob-active)" />
                  </label>
                </div>
              </div>

              <button
                className="neon-secondary rounded-xl px-3 py-1.5 text-xs font-semibold text-(--text-soft-strong) transition hover:shadow-[0_0_16px_rgba(var(--accent-rgb),0.25)]"
                onClick={handleSaveSettings}
              >
                Save settings
              </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App

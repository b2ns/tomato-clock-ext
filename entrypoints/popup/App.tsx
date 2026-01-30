import type { TimerMessage, TimerResponse } from '@/shared/messages'
import { clampMinutes, createDefaultState, formatDuration, type TimerState } from '@/shared/timer'
import { useEffect, useMemo, useState } from 'react'

type TimerAction = (message: TimerMessage) => void

const sendMessage: TimerAction = (message) => {
  chrome.runtime.sendMessage(message, () => void 0)
}

const requestState = (): Promise<TimerState> =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response: TimerResponse) =>
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
    chrome.storage.onChanged.addListener(handleChange)
    return () => chrome.storage.onChanged.removeListener(handleChange)
  }, [])

  return { state, now }
}

function App() {
  const { state, now } = useTimerState()
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

  const statusLabel =
    state.status === 'running' ? 'Running' : state.status === 'paused' ? 'Paused' : 'Ready'

  const modeLabel = state.mode === 'work' ? 'Focus' : 'Break'

  const onStart = () => {
    sendMessage({
      type: 'START',
      payload: {
        work: clampMinutes(Number(workMinutes)),
        break: clampMinutes(Number(breakMinutes)),
      },
      mode: 'work',
    })
  }

  return (
    <main className="grid w-80 gap-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 shadow-[0_18px_40px_rgba(56,189,248,0.18)]">
      <header className="flex items-center justify-between gap-3">
        <div className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.35)]">
          Tomato Clock
        </div>
        <div className="text-sm font-semibold text-indigo-200">{modeLabel}</div>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
        <div className="tabular-nums text-4xl font-semibold text-slate-50">
          {formatDuration(remainingMs)}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
          {statusLabel}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="grid gap-2">
          <label
            htmlFor="workMinutes"
            className="text-[11px] uppercase tracking-[0.18em] text-slate-300/80"
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
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="breakMinutes"
            className="text-[11px] uppercase tracking-[0.18em] text-slate-300/80"
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
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3 py-2 font-semibold text-slate-950 shadow-[0_10px_20px_rgba(59,130,246,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(59,130,246,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onStart}
          disabled={state.status === 'running'}
        >
          Start
        </button>
        <button
          className="rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2 font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(15,23,42,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => sendMessage({ type: 'PAUSE' })}
          disabled={state.status !== 'running'}
        >
          Pause
        </button>
        <button
          className="rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2 font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(15,23,42,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => sendMessage({ type: 'RESUME' })}
          disabled={state.status !== 'paused'}
        >
          Resume
        </button>
        <button
          className="rounded-xl border border-cyan-400/30 bg-transparent px-3 py-2 font-semibold text-cyan-200 transition hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => sendMessage({ type: 'RESET' })}
          disabled={state.status === 'idle'}
        >
          Reset
        </button>
      </section>
    </main>
  )
}

export default App

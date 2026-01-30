import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  clampMinutes,
  createDefaultState,
  formatDuration,
  type TimerState,
} from '@/shared/timer'
import type { TimerMessage, TimerResponse } from '@/shared/messages'

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
    state.status === 'running'
      ? 'Running'
      : state.status === 'paused'
        ? 'Paused'
        : 'Ready'

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
    <main className="app">
      <header className="app__header">
        <div className="app__badge">Tomato Clock</div>
        <div className="app__mode">{modeLabel}</div>
      </header>

      <section className="app__timer">
        <div className="timer__time">{formatDuration(remainingMs)}</div>
        <div className="timer__status">{statusLabel}</div>
      </section>

      <section className="app__controls">
        <div className="control">
          <label htmlFor="workMinutes">Work minutes</label>
          <input
            id="workMinutes"
            type="number"
            min={1}
            max={180}
            value={workMinutes}
            onChange={(event) => setWorkMinutes(event.target.valueAsNumber)}
          />
        </div>
        <div className="control">
          <label htmlFor="breakMinutes">Break minutes</label>
          <input
            id="breakMinutes"
            type="number"
            min={1}
            max={180}
            value={breakMinutes}
            onChange={(event) => setBreakMinutes(event.target.valueAsNumber)}
          />
        </div>
      </section>

      <section className="app__actions">
        <button
          className="btn btn--primary"
          onClick={onStart}
          disabled={state.status === 'running'}
        >
          Start
        </button>
        <button
          className="btn"
          onClick={() => sendMessage({ type: 'PAUSE' })}
          disabled={state.status !== 'running'}
        >
          Pause
        </button>
        <button
          className="btn"
          onClick={() => sendMessage({ type: 'RESUME' })}
          disabled={state.status !== 'paused'}
        >
          Resume
        </button>
        <button
          className="btn btn--ghost"
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

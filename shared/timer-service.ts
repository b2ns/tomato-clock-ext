import {
  completeSegment,
  createDefaultState,
  pauseTimer,
  resetTimer,
  resumeTimer,
  startTimer,
  withCustomDurations,
  type TimerState,
} from './timer'
import type { TimerMessage } from './messages'

export type TimerAdapter = {
  getStoredState: () => Promise<TimerState | null>
  setStoredState: (state: TimerState) => Promise<void>
  scheduleAlarm: (when: number | null) => Promise<void>
  notify: (title: string, message: string) => Promise<void>
  now: () => number
}

export function createTimerService(adapter: TimerAdapter) {
  let state = createDefaultState()

  const persist = async (next: TimerState) => {
    state = next
    await adapter.setStoredState(state)
    await adapter.scheduleAlarm(
      state.status === 'running' && state.endAt ? state.endAt : null,
    )
    return state
  }

  const ensureInitialized = async () => {
    const stored = await adapter.getStoredState()
    state = stored ? { ...createDefaultState(), ...stored } : createDefaultState()
  }

  const buildNotification = (mode: TimerState['mode']) => {
    if (mode === 'work') {
      return { title: 'Work session complete', message: 'Time for a break.' }
    }
    return { title: 'Break complete', message: 'Time to focus.' }
  }

  const completeIfOverdue = async (now: number) => {
    if (state.status === 'running' && state.endAt && state.endAt <= now) {
      const finishedMode = state.mode
      state = completeSegment(state)
      const { title, message } = buildNotification(finishedMode)
      await adapter.notify(title, message)
    }
  }

  return {
    async initialize() {
      await ensureInitialized()
      await completeIfOverdue(adapter.now())
      return persist(state)
    },

    async handleMessage(message: TimerMessage) {
      await ensureInitialized()
      switch (message.type) {
        case 'GET_STATE':
          return state
        case 'SET_CUSTOM':
          return persist(withCustomDurations(state, message.payload))
        case 'START': {
          const updated = withCustomDurations(state, message.payload)
          return persist(startTimer(updated, adapter.now(), message.mode ?? 'work'))
        }
        case 'PAUSE':
          return persist(pauseTimer(state, adapter.now()))
        case 'RESUME':
          return persist(resumeTimer(state, adapter.now()))
        case 'RESET':
          return persist(resetTimer(state))
        default:
          return state
      }
    },

    async handleAlarm() {
      await ensureInitialized()
      await completeIfOverdue(adapter.now())
      return persist(state)
    },

    getState() {
      return state
    },
  }
}

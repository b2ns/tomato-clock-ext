import type { TimerDurations, TimerMode, TimerState } from './timer'

export type TimerMessage =
  | { type: 'GET_STATE' }
  | { type: 'SET_CUSTOM'; payload: TimerDurations }
  | { type: 'SET_SOUND'; payload: { enabled: boolean } }
  | { type: 'PLAY_SOUND' }
  | { type: 'START'; payload: TimerDurations; mode?: TimerMode }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }

export type TimerResponse = {
  state: TimerState
}

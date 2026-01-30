export type TimerMode = 'work' | 'break'
export type TimerStatus = 'idle' | 'running' | 'paused'

export type TimerDurations = {
  work: number
  break: number
}

export type TimerState = {
  mode: TimerMode
  status: TimerStatus
  durationMs: number
  remainingMs: number | null
  endAt: number | null
  preset: TimerDurations
  custom: TimerDurations
  soundEnabled: boolean
  notificationsEnabled: boolean
}

export const DEFAULT_PRESET: TimerDurations = { work: 25, break: 5 }
export const MIN_MINUTES = 1
export const MAX_MINUTES = 180

export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return MIN_MINUTES
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)))
}

export function minutesToMs(minutes: number): number {
  return clampMinutes(minutes) * 60_000
}

export function createDefaultState(): TimerState {
  return {
    mode: 'work',
    status: 'idle',
    durationMs: minutesToMs(DEFAULT_PRESET.work),
    remainingMs: null,
    endAt: null,
    preset: { ...DEFAULT_PRESET },
    custom: { ...DEFAULT_PRESET },
    soundEnabled: true,
    notificationsEnabled: true,
  }
}

export function withCustomDurations(
  state: TimerState,
  durations: TimerDurations,
): TimerState {
  const custom = {
    work: clampMinutes(durations.work),
    break: clampMinutes(durations.break),
  }
  const durationMs =
    state.status === 'idle' ? minutesToMs(custom[state.mode]) : state.durationMs
  return {
    ...state,
    custom,
    durationMs,
  }
}

export function withSoundEnabled(state: TimerState, enabled: boolean): TimerState {
  return {
    ...state,
    soundEnabled: enabled,
  }
}

export function withNotificationsEnabled(state: TimerState, enabled: boolean): TimerState {
  return {
    ...state,
    notificationsEnabled: enabled,
  }
}

export function startTimer(
  state: TimerState,
  now: number,
  mode: TimerMode,
): TimerState {
  const durationMs = minutesToMs(state.custom[mode])
  return {
    ...state,
    mode,
    status: 'running',
    durationMs,
    remainingMs: null,
    endAt: now + durationMs,
  }
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' || !state.endAt) return state
  return {
    ...state,
    status: 'paused',
    remainingMs: Math.max(0, state.endAt - now),
    endAt: null,
  }
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'paused' || state.remainingMs === null) return state
  return {
    ...state,
    status: 'running',
    endAt: now + state.remainingMs,
    remainingMs: null,
  }
}

export function resetTimer(state: TimerState): TimerState {
  return {
    ...state,
    status: 'idle',
    endAt: null,
    remainingMs: null,
    durationMs: minutesToMs(state.custom[state.mode]),
  }
}

export function completeSegment(state: TimerState): TimerState {
  const nextMode: TimerMode = state.mode === 'work' ? 'break' : 'work'
  return {
    ...state,
    mode: nextMode,
    status: 'idle',
    endAt: null,
    remainingMs: null,
    durationMs: minutesToMs(state.custom[nextMode]),
  }
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

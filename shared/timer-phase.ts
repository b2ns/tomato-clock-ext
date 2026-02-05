import type { TimerState } from './timer'

export type TimerPhase = 'focusing' | 'focus_over' | 'rest' | 'rest_over' | 'paused'
export type PhaseLabelKey =
  | 'phase_focusing'
  | 'phase_focus_over'
  | 'phase_rest'
  | 'phase_rest_over'
  | 'phase_paused'

export function deriveTimerPhase(state: TimerState): TimerPhase {
  if (state.status === 'paused') return 'paused'
  if (state.status === 'running') {
    return state.mode === 'work' ? 'focusing' : 'rest'
  }
  return state.mode === 'break' ? 'focus_over' : 'rest_over'
}

const PHASE_LABEL_KEYS: Record<TimerPhase, PhaseLabelKey> = {
  focusing: 'phase_focusing',
  focus_over: 'phase_focus_over',
  rest: 'phase_rest',
  rest_over: 'phase_rest_over',
  paused: 'phase_paused',
}

export function getPhaseLabelKey(phase: TimerPhase): PhaseLabelKey {
  return PHASE_LABEL_KEYS[phase]
}

const BADGE_PRESENTATION: Record<
  TimerPhase,
  { text: string; backgroundColor: string; textColor: string }
> = {
  focusing: { text: 'FOC', backgroundColor: '#22c55e', textColor: '#0b1a10' },
  focus_over: { text: 'OVR', backgroundColor: '#f59e0b', textColor: '#1f1200' },
  rest: { text: 'RST', backgroundColor: '#3b82f6', textColor: '#ffffff' },
  rest_over: { text: 'RDY', backgroundColor: '#ec4899', textColor: '#ffffff' },
  paused: { text: 'PAU', backgroundColor: '#6b7280', textColor: '#ffffff' },
}

export function getBadgePresentation(phase: TimerPhase) {
  return BADGE_PRESENTATION[phase]
}

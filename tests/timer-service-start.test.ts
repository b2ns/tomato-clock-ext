import assert from 'node:assert/strict'
import test from 'node:test'
import { createTimerService } from '../shared/timer-service'
import { createDefaultState, minutesToMs, type TimerState } from '../shared/timer'

test('start defaults to current mode when mode is omitted', async () => {
  const baseState = createDefaultState()
  let storedState: TimerState = {
    ...baseState,
    mode: 'break' as const,
    status: 'idle' as const,
    durationMs: minutesToMs(baseState.custom.break),
  }

  const adapter = {
    getStoredState: async () => storedState,
    setStoredState: async (next: TimerState) => {
      storedState = next
    },
    scheduleAlarm: async () => {},
    notify: async () => {},
    playSound: async () => {},
    now: () => 1_000,
  }

  const service = createTimerService(adapter)
  const next = await service.handleMessage({
    type: 'START',
    payload: storedState.custom,
  })

  assert.equal(next.mode, 'break')
})

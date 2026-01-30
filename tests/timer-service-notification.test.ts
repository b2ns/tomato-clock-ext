import assert from 'node:assert/strict'
import test from 'node:test'
import { createTimerService } from '../shared/timer-service'
import { createDefaultState, minutesToMs, type TimerState } from '../shared/timer'

test('does not send notification when notifications are disabled', async () => {
  const baseState = createDefaultState()
  const now = 1_000
  let storedState: TimerState = {
    ...baseState,
    status: 'running' as const,
    mode: 'work' as const,
    durationMs: minutesToMs(baseState.custom.work),
    endAt: now - 1,
    soundEnabled: true,
    notificationsEnabled: false,
  }

  let notifyCount = 0
  let soundCount = 0

  const adapter = {
    getStoredState: async () => storedState,
    setStoredState: async (next: TimerState) => {
      storedState = next
    },
    scheduleAlarm: async () => {},
    notify: async () => {
      notifyCount += 1
    },
    playSound: async () => {
      soundCount += 1
    },
    now: () => now,
  }

  const service = createTimerService(adapter)
  await service.handleAlarm()

  assert.equal(notifyCount, 0)
  assert.equal(soundCount, 1)
})

test('updates notification preference via SET_NOTIFICATIONS', async () => {
  const baseState = createDefaultState()
  let storedState: TimerState = {
    ...baseState,
    status: 'idle' as const,
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
    type: 'SET_NOTIFICATIONS',
    payload: { enabled: false },
  })

  assert.equal(next.notificationsEnabled, false)
})

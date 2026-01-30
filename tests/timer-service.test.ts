import { describe, expect, test } from 'vitest'
import { createTimerService } from '@/shared/timer-service'
import type { TimerMessage } from '@/shared/messages'
import { createDefaultState } from '@/shared/timer'

type Adapter = ReturnType<typeof createAdapter>

function createAdapter(now = 1_000) {
  const calls: string[] = []
  let stored = createDefaultState()
  let scheduledWhen: number | null = null
  return {
    calls,
    getStoredState: async () => stored,
    setStoredState: async (next: typeof stored) => {
      calls.push('setStoredState')
      stored = next
    },
    scheduleAlarm: async (when: number | null) => {
      calls.push(`schedule:${when ?? 'null'}`)
      scheduledWhen = when ?? null
    },
    notify: async (title: string, message: string) => {
      calls.push(`notify:${title}:${message}`)
    },
    playSound: async () => {
      calls.push('playSound')
    },
    now: () => now,
    get scheduledWhen() {
      return scheduledWhen
    },
    get stored() {
      return stored
    },
  }
}

describe('timer service', () => {
  test('START schedules an alarm and persists running state', async () => {
    const adapter = createAdapter()
    const service = createTimerService(adapter)
    await service.initialize()
    const message: TimerMessage = {
      type: 'START',
      payload: { work: 25, break: 5 },
    }
    const state = await service.handleMessage(message)
    expect(state.status).toBe('running')
    expect(adapter.scheduledWhen).toBe(state.endAt)
  })

  test('PAUSE clears alarm and sets remainingMs', async () => {
    const adapter = createAdapter()
    const service = createTimerService(adapter)
    await service.initialize()
    await service.handleMessage({
      type: 'START',
      payload: { work: 25, break: 5 },
    })
    const paused = await service.handleMessage({ type: 'PAUSE' })
    expect(paused.status).toBe('paused')
    expect(adapter.scheduledWhen).toBeNull()
  })

  test('alarm completion notifies and idles next mode', async () => {
    const adapter = createAdapter()
    const service = createTimerService(adapter)
    await service.initialize()
    await service.handleMessage({
      type: 'START',
      payload: { work: 25, break: 5 },
    })
    const overdueAdapter: Adapter = {
      ...adapter,
      now: () => Number.MAX_SAFE_INTEGER,
    }
    const overdueService = createTimerService(overdueAdapter)
    await overdueService.initialize()
    const next = await overdueService.handleAlarm()
    expect(next.status).toBe('idle')
    expect(next.mode).toBe('break')
    expect(overdueAdapter.calls.some((call) => call.startsWith('notify:'))).toBe(
      true,
    )
  })

  test('alarm completion plays sound when enabled', async () => {
    const adapter = createAdapter()
    const service = createTimerService(adapter)
    await service.initialize()
    await service.handleMessage({
      type: 'START',
      payload: { work: 25, break: 5 },
    })
    const overdueAdapter: Adapter = {
      ...adapter,
      now: () => Number.MAX_SAFE_INTEGER,
    }
    const overdueService = createTimerService(overdueAdapter)
    await overdueService.initialize()
    await overdueService.handleAlarm()
    expect(overdueAdapter.calls).toContain('playSound')
  })

  test('SET_SOUND updates preference', async () => {
    const adapter = createAdapter()
    const service = createTimerService(adapter)
    await service.initialize()
    const updated = await service.handleMessage({
      type: 'SET_SOUND',
      payload: { enabled: false },
    })
    expect(updated.soundEnabled).toBe(false)
  })
})

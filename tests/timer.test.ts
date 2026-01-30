import { describe, expect, test } from 'vitest'
import {
  clampMinutes,
  completeSegment,
  createDefaultState,
  formatDuration,
  pauseTimer,
  resumeTimer,
  startTimer,
  withCustomDurations,
} from '@/shared/timer'

describe('timer engine', () => {
  test('startTimer uses custom durations and sets endAt', () => {
    const state = createDefaultState()
    const now = 1_000
    const updated = startTimer(
      withCustomDurations(state, { work: 30, break: 5 }),
      now,
      'work',
    )

    expect(updated.status).toBe('running')
    expect(updated.mode).toBe('work')
    expect(updated.durationMs).toBe(30 * 60_000)
    expect(updated.endAt).toBe(now + 30 * 60_000)
  })

  test('pauseTimer stores remainingMs and clears endAt', () => {
    const now = 10_000
    const running = {
      ...createDefaultState(),
      status: 'running' as const,
      mode: 'work' as const,
      durationMs: 25 * 60_000,
      endAt: now + 5_000,
      remainingMs: null,
    }

    const paused = pauseTimer(running, now)
    expect(paused.status).toBe('paused')
    expect(paused.remainingMs).toBe(5_000)
    expect(paused.endAt).toBeNull()
  })

  test('resumeTimer restores endAt and clears remainingMs', () => {
    const now = 20_000
    const paused = {
      ...createDefaultState(),
      status: 'paused' as const,
      remainingMs: 12_000,
      endAt: null,
    }
    const resumed = resumeTimer(paused, now)
    expect(resumed.status).toBe('running')
    expect(resumed.endAt).toBe(now + 12_000)
    expect(resumed.remainingMs).toBeNull()
  })

  test('completeSegment toggles mode and idles', () => {
    const running = {
      ...createDefaultState(),
      status: 'running' as const,
      mode: 'work' as const,
      durationMs: 25 * 60_000,
      endAt: 123,
    }
    const next = completeSegment(running)
    expect(next.mode).toBe('break')
    expect(next.status).toBe('idle')
    expect(next.endAt).toBeNull()
  })

  test('clampMinutes enforces bounds', () => {
    expect(clampMinutes(-1)).toBe(1)
    expect(clampMinutes(500)).toBe(180)
  })

  test('formatDuration renders mm:ss', () => {
    expect(formatDuration(65_000)).toBe('01:05')
  })
})

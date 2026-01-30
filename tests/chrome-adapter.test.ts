import { describe, expect, test, vi } from 'vitest'
import { createChromeAdapter, ALARM_NAME, STORAGE_KEY } from '@/shared/chrome-adapter'
import { createDefaultState } from '@/shared/timer'

function setupChrome() {
  const alarms = {
    clear: vi.fn((name: string, cb: () => void) => cb?.()),
    create: vi.fn(),
  }
  const storage = {
    local: {
      get: vi.fn((key: string, cb: (value: any) => void) =>
        cb({ [key]: createDefaultState() }),
      ),
      set: vi.fn((_value: any, cb: () => void) => cb?.()),
    },
  }
  const notifications = {
    create: vi.fn((_options: any, cb: () => void) => cb?.()),
  }

  ;(globalThis as any).chrome = { alarms, storage, notifications }
  return { alarms, storage, notifications }
}

describe('chrome adapter', () => {
  test('scheduleAlarm clears and optionally creates', async () => {
    const { alarms } = setupChrome()
    const adapter = createChromeAdapter()
    await adapter.scheduleAlarm(123)
    expect(alarms.clear).toHaveBeenCalledWith(ALARM_NAME, expect.any(Function))
    expect(alarms.create).toHaveBeenCalledWith(ALARM_NAME, { when: 123 })
  })

  test('getStoredState reads storage key', async () => {
    const { storage } = setupChrome()
    const adapter = createChromeAdapter()
    await adapter.getStoredState()
    expect(storage.local.get).toHaveBeenCalledWith(STORAGE_KEY, expect.any(Function))
  })
})

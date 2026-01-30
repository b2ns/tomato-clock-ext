# Pomodoro Timer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a persistent Pomodoro timer extension with a popup UI, background alarms, and notifications.

**Architecture:** A testable timer engine + service layer powers the background entrypoint, while the popup reads state and sends actions via messages. State is persisted in `chrome.storage.local`, alarms are scheduled via `chrome.alarms`, and notifications fire on completion.

**Tech Stack:** WXT (MV3), React, TypeScript, Vitest, Testing Library, Chrome Extension APIs.

**References:** @superpowers:test-driven-development, @modern-frontend-best-practices

### Task 1: Add test tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

**Step 1: Update scripts and dev deps**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.6.0",
    "jsdom": "^24.0.0"
  }
}
```

**Step 2: Add Vitest config**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
```

**Step 3: Add test setup**

```ts
import '@testing-library/jest-dom'
```

**Step 4: Verify tooling**

Run: `npm run test`
Expected: no tests found (or similar), exit code 0.

### Task 2: Timer engine (state + pure helpers)

**Files:**
- Create: `shared/timer.ts`
- Create: `tests/timer.test.ts`

**Step 1: Write failing tests**

```ts
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
```

**Step 2: Run tests to verify failure**

Run: `npm run test -- tests/timer.test.ts`
Expected: FAIL (module not found `@/shared/timer`).

**Step 3: Implement timer engine**

```ts
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
```

**Step 4: Run tests**

Run: `npm run test -- tests/timer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add shared/timer.ts tests/timer.test.ts vitest.config.ts tests/setup.ts package.json
git commit -m "test: add timer engine tests and helpers"
```

### Task 3: Timer service (storage + alarms + notifications)

**Files:**
- Create: `shared/timer-service.ts`
- Create: `shared/messages.ts`
- Create: `tests/timer-service.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from 'vitest'
import { createTimerService } from '@/shared/timer-service'
import type { TimerMessage } from '@/shared/messages'
import { createDefaultState } from '@/shared/timer'

function createAdapter(now = 1_000) {
  const calls: string[] = []
  let stored = createDefaultState()
  let scheduledWhen: number | null = null
  return {
    calls,
    getStoredState: async () => stored,
    setStoredState: async (next) => {
      calls.push('setStoredState')
      stored = next
    },
    scheduleAlarm: async (when) => {
      calls.push(`schedule:${when ?? 'null'}`)
      scheduledWhen = when ?? null
    },
    notify: async (title, message) => {
      calls.push(`notify:${title}:${message}`)
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
      payload: { workMinutes: 25, breakMinutes: 5 },
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
      payload: { workMinutes: 25, breakMinutes: 5 },
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
      payload: { workMinutes: 25, breakMinutes: 5 },
    })
    adapter.now = () => Number.MAX_SAFE_INTEGER
    const next = await service.handleAlarm()
    expect(next.status).toBe('idle')
    expect(next.mode).toBe('break')
    expect(adapter.calls.some((call) => call.startsWith('notify:'))).toBe(true)
  })
})
```

**Step 2: Run tests to verify failure**

Run: `npm run test -- tests/timer-service.test.ts`
Expected: FAIL (module not found `@/shared/timer-service`).

**Step 3: Implement messages + service**

`shared/messages.ts`:

```ts
import type { TimerMode, TimerState, TimerDurations } from './timer'

export type TimerMessage =
  | { type: 'GET_STATE' }
  | { type: 'SET_CUSTOM'; payload: TimerDurations }
  | { type: 'START'; payload: TimerDurations; mode?: TimerMode }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }

export type TimerResponse = {
  state: TimerState
}
```

`shared/timer-service.ts`:

```ts
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
```

**Step 4: Run tests**

Run: `npm run test -- tests/timer-service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add shared/messages.ts shared/timer-service.ts tests/timer-service.test.ts
git commit -m "test: add timer service behavior"
```

### Task 4: Chrome adapter + background entrypoint

**Files:**
- Create: `shared/chrome-adapter.ts`
- Create: `tests/chrome-adapter.test.ts`
- Modify: `entrypoints/background.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test, vi } from 'vitest'
import { createChromeAdapter, ALARM_NAME, STORAGE_KEY } from '@/shared/chrome-adapter'
import { createDefaultState } from '@/shared/timer'

function setupChrome() {
  const alarms = {
    clear: vi.fn((name, cb) => cb?.()),
    create: vi.fn(),
  }
  const storage = {
    local: {
      get: vi.fn((key, cb) => cb({ [key]: createDefaultState() })),
      set: vi.fn((_value, cb) => cb?.()),
    },
  }
  const notifications = {
    create: vi.fn((_options, cb) => cb?.()),
  }
  // @ts-expect-error test mock
  globalThis.chrome = { alarms, storage, notifications }
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
```

**Step 2: Run tests to verify failure**

Run: `npm run test -- tests/chrome-adapter.test.ts`
Expected: FAIL (module not found `@/shared/chrome-adapter`).

**Step 3: Implement adapter**

```ts
import type { TimerAdapter } from './timer-service'
import type { TimerState } from './timer'

export const STORAGE_KEY = 'timerState'
export const ALARM_NAME = 'pomodoro'

const getStorage = (): Promise<Record<string, TimerState | undefined>> =>
  new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => resolve(result))
  })

const setStorage = (state: TimerState): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: state }, () => resolve())
  })

export function createChromeAdapter(): TimerAdapter {
  return {
    now: () => Date.now(),
    async getStoredState() {
      const result = await getStorage()
      return result[STORAGE_KEY] ?? null
    },
    async setStoredState(state) {
      await setStorage(state)
    },
    scheduleAlarm: (when) =>
      new Promise((resolve) => {
        chrome.alarms.clear(ALARM_NAME, () => {
          if (when) {
            chrome.alarms.create(ALARM_NAME, { when })
          }
          resolve()
        })
      }),
    notify: (title, message) =>
      new Promise((resolve) => {
        chrome.notifications.create(
          {
            type: 'basic',
            iconUrl: 'icon/128.png',
            title,
            message,
          },
          () => resolve(),
        )
      }),
  }
}
```

**Step 4: Wire background entrypoint**

```ts
import { defineBackground } from 'wxt/utils/define-background'
import { createChromeAdapter, ALARM_NAME } from '@/shared/chrome-adapter'
import { createTimerService } from '@/shared/timer-service'
import type { TimerMessage, TimerResponse } from '@/shared/messages'

export default defineBackground(() => {
  const service = createTimerService(createChromeAdapter())
  void service.initialize()

  chrome.runtime.onInstalled.addListener(() => void service.initialize())
  chrome.runtime.onStartup.addListener(() => void service.initialize())

  chrome.runtime.onMessage.addListener(
    (message: TimerMessage, _sender, sendResponse) => {
      service
        .handleMessage(message)
        .then((state) => sendResponse({ state } satisfies TimerResponse))
      return true
    },
  )

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM_NAME) return
    void service.handleAlarm()
  })
})
```

**Step 5: Run tests**

Run: `npm run test -- tests/chrome-adapter.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add shared/chrome-adapter.ts entrypoints/background.ts tests/chrome-adapter.test.ts
git commit -m "feat: add background timer service wiring"
```

### Task 5: Add manifest permissions

**Files:**
- Modify: `wxt.config.ts`

**Step 1: Update WXT config**

```ts
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['alarms', 'storage', 'notifications'],
  },
})
```

**Step 2: Commit**

```bash
git add wxt.config.ts
git commit -m "chore: add extension permissions"
```

### Task 6: Popup UI + styles

**Files:**
- Modify: `entrypoints/popup/App.tsx`
- Modify: `entrypoints/popup/App.css`
- Modify: `entrypoints/popup/style.css`
- Create: `tests/app.test.tsx`

**Step 1: Write failing UI tests**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import App from '@/entrypoints/popup/App'
import { createDefaultState } from '@/shared/timer'

function setupChrome(state = createDefaultState()) {
  const sendMessage = vi.fn((_message, cb) => cb?.({ state }))
  const listeners: ((changes: any, area: string) => void)[] = []
  // @ts-expect-error test mock
  globalThis.chrome = {
    runtime: { sendMessage },
    storage: {
      onChanged: {
        addListener: (fn: any) => listeners.push(fn),
        removeListener: (fn: any) =>
          listeners.splice(listeners.indexOf(fn), 1),
      },
    },
  }
  return { sendMessage }
}

describe('popup App', () => {
  test('renders default durations and timer', async () => {
    setupChrome()
    render(<App />)
    expect(await screen.findByText('25:00')).toBeInTheDocument()
    expect(screen.getByLabelText(/work minutes/i)).toHaveValue(25)
    expect(screen.getByLabelText(/break minutes/i)).toHaveValue(5)
  })

  test('clicking Start sends message', async () => {
    const { sendMessage } = setupChrome()
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /start/i }))
    expect(sendMessage).toHaveBeenCalled()
  })
})
```

**Step 2: Run tests to verify failure**

Run: `npm run test -- tests/app.test.tsx`
Expected: FAIL (component not updated or missing labels).

**Step 3: Implement popup UI**

`entrypoints/popup/App.tsx`:

```tsx
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
```

**Step 4: Update styles**

`entrypoints/popup/style.css`:

```css
:root {
  font-family: 'Space Grotesk', 'Fira Sans', 'Segoe UI', sans-serif;
  line-height: 1.4;
  font-weight: 400;
  color: #1d1412;
  background-color: #f8f2ea;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: stretch;
  background: radial-gradient(circle at top, #ffe7d3, #f5e6dd 45%, #f1d8c8);
}
```

`entrypoints/popup/App.css`:

```css
.app {
  width: 320px;
  padding: 20px;
  display: grid;
  gap: 16px;
  background: linear-gradient(145deg, #fff7ef, #f7e1d2);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(86, 45, 24, 0.18);
}

.app__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.app__badge {
  padding: 6px 10px;
  background: #ffb28a;
  border-radius: 999px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5b1f0f;
}

.app__mode {
  font-weight: 600;
  font-size: 14px;
  color: #7b3321;
}

.app__timer {
  text-align: center;
  padding: 18px 0;
  background: #fff1e7;
  border-radius: 16px;
  border: 1px solid #f7c6ad;
}

.timer__time {
  font-size: 40px;
  font-weight: 600;
  color: #5e2210;
}

.timer__status {
  margin-top: 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #b04c28;
}

.app__controls {
  display: grid;
  gap: 12px;
}

.control {
  display: grid;
  gap: 6px;
}

.control label {
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7b3321;
}

.control input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e4b6a1;
  background: #fff8f3;
  font-size: 14px;
  color: #5b1f0f;
}

.app__actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.btn {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: #f1c1a5;
  color: #5b1f0f;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(95, 32, 9, 0.18);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #ff7a4b;
  color: #fff7f2;
}

.btn--ghost {
  background: transparent;
  border-color: #e4b6a1;
}
```

**Step 5: Run tests**

Run: `npm run test -- tests/app.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add entrypoints/popup/App.tsx entrypoints/popup/App.css entrypoints/popup/style.css tests/app.test.tsx
git commit -m "feat: add popup pomodoro UI"
```

### Task 7: Manual verification

**Step 1: Run dev server**

Run: `npm run dev`
Expected: WXT dev server starts.

**Step 2: Verify behavior**
- Start timer, close popup, wait for notification.
- Pause/resume with popup closed and reopened.
- Restart browser and confirm state persists.


# Timer Phase & Badge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a derived timer phase label in the popup and keep the extension badge in sync with timer state using 3-character labels and colors.

**Architecture:** Keep `TimerState` unchanged and compute a derived phase from `status` + `mode`. The background updates the badge on every state persist; the popup derives the same phase and displays a label.

**Tech Stack:** TypeScript, React (popup), WXT WebExtension APIs.

### Task 1: Add derived phase helpers + tests

**Files:**

- Create: `shared/timer-phase.ts`
- Create: `tests/timer-phase.test.ts`

**Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { createDefaultState } from '../shared/timer'
import { deriveTimerPhase, getBadgePresentation, getPhaseLabel } from '../shared/timer-phase'

test('deriveTimerPhase maps status/mode to phase', () => {
  const base = createDefaultState()
  assert.equal(deriveTimerPhase({ ...base, status: 'running', mode: 'work' }), 'focusing')
  assert.equal(deriveTimerPhase({ ...base, status: 'running', mode: 'break' }), 'rest')
  assert.equal(deriveTimerPhase({ ...base, status: 'paused', mode: 'work' }), 'paused')
  assert.equal(deriveTimerPhase({ ...base, status: 'idle', mode: 'break' }), 'focus_over')
  assert.equal(deriveTimerPhase({ ...base, status: 'idle', mode: 'work' }), 'rest_over')
})

test('badge presentation uses 3-char text', () => {
  const presentation = getBadgePresentation('rest_over')
  assert.equal(presentation.text.length, 3)
  assert.equal(presentation.text, 'RDY')
})

test('phase label is user-facing', () => {
  assert.equal(getPhaseLabel('focus_over'), 'Focus is over')
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/timer-phase.test.ts`
Expected: FAIL with "Cannot find module '../shared/timer-phase'".

**Step 3: Write minimal implementation**

```ts
import type { TimerState } from './timer'

export type TimerPhase = 'focusing' | 'focus_over' | 'rest' | 'rest_over' | 'paused'

export function deriveTimerPhase(state: TimerState): TimerPhase {
  if (state.status === 'paused') return 'paused'
  if (state.status === 'running') {
    return state.mode === 'work' ? 'focusing' : 'rest'
  }
  return state.mode === 'break' ? 'focus_over' : 'rest_over'
}

const PHASE_LABELS: Record<TimerPhase, string> = {
  focusing: 'Focusing',
  focus_over: 'Focus is over',
  rest: 'Rest',
  rest_over: 'Rest is over',
  paused: 'Paused',
}

export function getPhaseLabel(phase: TimerPhase): string {
  return PHASE_LABELS[phase]
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
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/timer-phase.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add shared/timer-phase.ts tests/timer-phase.test.ts
git commit -m "feat: add timer phase helpers"
```

### Task 2: Update timer service to set badge on persist

**Files:**

- Modify: `shared/timer-service.ts`
- Modify: `tests/timer-service-start.test.ts`
- Modify: `tests/timer-service-notification.test.ts`

**Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { createTimerService } from '../shared/timer-service'
import { createDefaultState, type TimerState } from '../shared/timer'

test('persist updates badge with derived phase', async () => {
  const base = createDefaultState()
  let storedState: TimerState = { ...base, status: 'running', mode: 'work' }
  let badgePhase: string | null = null

  const adapter = {
    getStoredState: async () => storedState,
    setStoredState: async (next: TimerState) => {
      storedState = next
    },
    scheduleAlarm: async () => {},
    notify: async () => {},
    playSound: async () => {},
    setBadge: async (phase: string) => {
      badgePhase = phase
    },
    now: () => 1_000,
  }

  const service = createTimerService(adapter)
  await service.handleMessage({ type: 'GET_STATE' })

  assert.equal(badgePhase, 'focusing')
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/timer-service-start.test.ts`
Expected: FAIL with type errors for missing `setBadge` on adapter.

**Step 3: Write minimal implementation**

```ts
import { deriveTimerPhase } from './timer-phase'

export type TimerAdapter = {
  getStoredState: () => Promise<TimerState | null>
  setStoredState: (state: TimerState) => Promise<void>
  scheduleAlarm: (when: number | null) => Promise<void>
  notify: (title: string, message: string) => Promise<void>
  playSound: () => Promise<void>
  setBadge: (phase: ReturnType<typeof deriveTimerPhase>) => Promise<void>
  now: () => number
}

const persist = async (next: TimerState) => {
  state = next
  await adapter.setStoredState(state)
  await adapter.scheduleAlarm(state.status === 'running' && state.endAt ? state.endAt : null)
  await adapter.setBadge(deriveTimerPhase(state))
  return state
}
```

Update existing tests’ adapters by adding `setBadge: async () => {}`.

**Step 4: Run test to verify it passes**

Run: `node --test tests/timer-service-start.test.ts tests/timer-service-notification.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add shared/timer-service.ts tests/timer-service-start.test.ts tests/timer-service-notification.test.ts
git commit -m "feat: update badge on timer state changes"
```

### Task 3: Implement badge updates in the Chrome adapter

**Files:**

- Modify: `shared/chrome-adapter.ts`

**Step 1: Write the failing test**

No automated test for WebExtension APIs; skip.

**Step 2: Run test to verify it fails**

No test to run; skip.

**Step 3: Write minimal implementation**

```ts
import { getBadgePresentation, type TimerPhase } from './timer-phase'

setBadge: async (phase: TimerPhase) => {
  const presentation = getBadgePresentation(phase)
  await browser.action.setBadgeText({ text: presentation.text })
  await browser.action.setBadgeBackgroundColor({ color: presentation.backgroundColor })
  if (browser.action.setBadgeTextColor) {
    await browser.action.setBadgeTextColor({ color: presentation.textColor })
  }
},
```

**Step 4: Run test to verify it passes**

No test to run; skip.

**Step 5: Commit**

```bash
git add shared/chrome-adapter.ts
git commit -m "feat: set badge text and colors from timer phase"
```

### Task 4: Show phase label in the popup

**Files:**

- Modify: `entrypoints/popup/App.tsx`

**Step 1: Write the failing test**

No UI test framework configured; skip.

**Step 2: Run test to verify it fails**

No test to run; skip.

**Step 3: Write minimal implementation**

```tsx
import { deriveTimerPhase, getPhaseLabel } from '@/shared/timer-phase'

const phase = useMemo(() => deriveTimerPhase(state), [state])
const phaseLabel = getPhaseLabel(phase)

<div className="flex items-center justify-center text-[10px] tracking-[0.32em] text-(--text-muted) uppercase">
  {phaseLabel}
</div>
```

Place the label near the timer display.

**Step 4: Run test to verify it passes**

Manual check via `npm run dev` popup.

**Step 5: Commit**

```bash
git add entrypoints/popup/App.tsx
git commit -m "feat: display timer phase label in popup"
```

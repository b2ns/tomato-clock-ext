# Night Neon Tailwind Restyle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the popup CSS with Tailwind utility classes to achieve the night‑neon theme without changing layout or behavior.

**Architecture:** UI-only changes in `entrypoints/popup/App.tsx`. Remove `entrypoints/popup/App.css` and its import. No logic changes.

**Tech Stack:** React, WXT, Tailwind CSS, TypeScript, Vitest (tests waived by user).

---

### Task 1: Install dependencies (pnpm only)

**Files:**
- None

**Step 1: Install dependencies**

Run: `pnpm install`
Expected: dependencies install without errors.

---

### Task 2: Apply Tailwind classes to the popup UI

**Files:**
- Modify: `entrypoints/popup/App.tsx`

**Step 1: Remove the CSS import**

Delete:
```ts
import './App.css'
```

**Step 2: Replace the JSX classNames with Tailwind utilities**

Replace the `<main>...</main>` block with the following (structure unchanged, classNames updated):

```tsx
    <main className="grid w-80 gap-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 shadow-[0_18px_40px_rgba(56,189,248,0.18)]">
      <header className="flex items-center justify-between gap-3">
        <div className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.35)]">
          Tomato Clock
        </div>
        <div className="text-sm font-semibold text-indigo-200">{modeLabel}</div>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
        <div className="tabular-nums text-4xl font-semibold text-slate-50">{formatDuration(remainingMs)}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">{statusLabel}</div>
      </section>

      <section className="grid gap-3">
        <div className="grid gap-2">
          <label htmlFor="workMinutes" className="text-[11px] uppercase tracking-[0.18em] text-slate-300/80">
            Work minutes
          </label>
          <input
            id="workMinutes"
            type="number"
            min={1}
            max={180}
            value={workMinutes}
            onChange={(event) => setWorkMinutes(event.target.valueAsNumber)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="breakMinutes" className="text-[11px] uppercase tracking-[0.18em] text-slate-300/80">
            Break minutes
          </label>
          <input
            id="breakMinutes"
            type="number"
            min={1}
            max={180}
            value={breakMinutes}
            onChange={(event) => setBreakMinutes(event.target.valueAsNumber)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3 py-2 font-semibold text-slate-950 shadow-[0_10px_20px_rgba(59,130,246,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgba(59,130,246,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onStart}
          disabled={state.status === 'running'}
        >
          Start
        </button>
        <button
          className="rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2 font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(15,23,42,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => sendMessage({ type: 'PAUSE' })}
          disabled={state.status !== 'running'}
        >
          Pause
        </button>
        <button
          className="rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2 font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(15,23,42,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => sendMessage({ type: 'RESUME' })}
          disabled={state.status !== 'paused'}
        >
          Resume
        </button>
        <button
          className="rounded-xl border border-cyan-400/30 bg-transparent px-3 py-2 font-semibold text-cyan-200 transition hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => sendMessage({ type: 'RESET' })}
          disabled={state.status === 'idle'}
        >
          Reset
        </button>
      </section>
    </main>
```

**Step 3: Save the file**

No output expected.

---

### Task 3: Remove the old CSS file

**Files:**
- Delete: `entrypoints/popup/App.css`

**Step 1: Delete the file**

Run: `rm entrypoints/popup/App.css`
Expected: file removed.

**Step 2: Verify no references remain**

Run: `rg -n "App.css" entrypoints/popup`
Expected: no matches.

---

### Task 4: Manual verification (no automated tests)

**Files:**
- None

**Step 1: Launch dev server (Chromium)**

Run: `pnpm run dev`
Expected: dev server starts without errors; popup renders with night‑neon theme.

**Step 2: Optional typecheck**

Run: `pnpm run compile`
Expected: no TypeScript errors.

---

## Notes

- TDD and automated tests were explicitly waived by the user for this styling-only refactor.
- Do not introduce new behavior or layout changes.

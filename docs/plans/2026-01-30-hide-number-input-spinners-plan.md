# Hide Number Input Spinners Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove native spinner UI from number inputs styled with `.neon-input` while preserving numeric semantics and validation.

**Architecture:** Keep inputs as `type="number"` and apply CSS rules in the shared stylesheet. Target Firefox with `appearance` and WebKit with `::-webkit-*-spin-button` selectors.

**Tech Stack:** React, Tailwind (utility usage), shared CSS in `shared/style.css`.

### Task 1: Hide native number spinners via CSS

**Files:**
- Modify: `shared/style.css`
- Test: None (manual verification only)

**Step 1: Write the failing test**
No automated UI/CSS tests exist in this repo. Skip test creation and rely on manual verification.

**Step 2: Run test to verify it fails**
No automated tests to run. Skip.

**Step 3: Write minimal implementation**
Add CSS under the `.neon-input` rules:

```css
.neon-input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.neon-input[type='number']::-webkit-inner-spin-button,
.neon-input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
```

**Step 4: Run tests/verification**
Run: `pnpm run compile`
Expected: exit code 0.

**Step 5: Manual verification**
Open the popup UI and confirm:
- Spinners are hidden on Work/Break minute inputs.
- Arrow keys still increment/decrement values.
- Min/max attributes still constrain values.

**Step 6: Commit**
```bash
git add shared/style.css
git commit -m "style: hide number input spinners"
```

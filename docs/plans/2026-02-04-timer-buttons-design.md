# Timer Buttons Design (2026-02-04)

## Summary
Replace the single Start/Stop control with a two-button group: “Start working” and “Take a break.” Each button explicitly starts the timer in the chosen mode and restarts any active session, while the existing Pause/Resume control remains unchanged.

## Architecture
No architectural changes are required. The popup UI continues to communicate with the background via the existing message schema. We will reuse the `START` message’s optional `mode` field and the current timer state update flow from storage.

## Components
- `entrypoints/popup/App.tsx`: Replace the Start/Stop button with a two-button group in the actions area. Keep Pause/Resume below as a full-width secondary action.
- No changes to shared types or background logic; the timer already supports `mode` and duration selection.

## Data Flow
- “Start working” sends `{ type: 'START', payload: { work, break }, mode: 'work' }`.
- “Take a break” sends `{ type: 'START', payload: { work, break }, mode: 'break' }`.
- Both buttons always dispatch, even if the timer is running or paused, which resets the active session to the selected mode.
- Pause/Resume retains current behavior (`PAUSE` / `RESUME`) and remains disabled when idle.

## Error Handling
No new error paths. Input values are still clamped before sending, and the background timer logic already validates state transitions. UI does not need additional guards beyond existing disabled states.

## Testing
Manual verification in the popup:
- Clicking “Start working” starts a work session and updates the timer.
- Clicking “Take a break” starts a break session and updates the timer.
- Clicking either button while running or paused restarts in the selected mode.
- Pause/Resume still toggles correctly and remains disabled when idle.
- Settings panel and toggles remain functional.

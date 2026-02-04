# Timer Phase & Badge Design

## Goal
Show the current timer phase and mode as soon as the popup opens, and keep the extension action badge in sync with the timer state. The badge must fit 3 characters and use state-specific colors.

## Derived Phase Rules
We will not change `TimerState`. Instead, compute a derived phase from `status` + `mode`:

- If `status === 'paused'` → `paused`
- Else if `status === 'running'` and `mode === 'work'` → `focusing`
- Else if `status === 'running'` and `mode === 'break'` → `rest`
- Else (`status === 'idle'`):
  - `mode === 'break'` → `focus_over` (focus finished; ready to rest)
  - `mode === 'work'` → `rest_over` (rest finished; ready to focus)

## Badge Mapping
Badge text is limited to 3 characters. Mapping:

- `focusing` → `FOC`
- `focus_over` → `OVR`
- `rest` → `RST`
- `rest_over` → `RDY` ("ready" to focus)
- `paused` → `PAU`

Each phase will also get a dedicated badge background and text color for quick recognition.

## Background Updates
The background will own badge updates so the badge stays correct when the popup is closed. The timer service `persist()` will call a new adapter method (e.g. `setBadge(phase)`), which will:

- Call `browser.action.setBadgeText` with the 3-char label.
- Set `browser.action.setBadgeBackgroundColor` and `setBadgeTextColor` based on the phase.

This runs on initialize, message handling, alarms, and notification click (all go through `persist()`).

## Popup Display
The popup will derive the same phase and display a compact label near the timer (e.g., “Focusing”, “Focus is over”, “Rest”, “Rest is over”, “Paused”). The popup simply requests current state and maps it to the phase.

## Error Handling
Badge updates are best-effort. If badge API calls fail, the timer still runs. The popup already falls back to a default state if it can’t read state.

## Manual Verification
- Start focus: badge `FOC`, label “Focusing”.
- Pause: badge `PAU`, label “Paused”.
- Resume: badge `FOC`.
- Focus completes: badge `OVR`, label “Focus is over”.
- Start rest: badge `RST`, label “Rest”.
- Rest completes: badge `RDY`, label “Rest is over”.
- Open popup at any time: label matches the current phase.

# Focus/Rest Redesign (Calm & Restorative)

Date: 2026-02-04

## Goal
Shift the extension tone from work-first to focus/rest-first using a calm, restorative visual system and updated copy, while keeping the existing timer logic intact.

## Scope
- UI copy and labels in the popup.
- Visual theme update (colors, gradients, shadows, animations).
- Notifications text.
- README tone update.

Out of scope:
- Data model or storage migration.
- Timer logic changes.
- New features or settings.

## Architecture
- Keep the existing background timer service and storage flow intact.
- Update presentation only.
- Keep internal modes as `work` and `break`, map to user-facing “focus” and “rest”.

## Components
- Popup header keeps “Tomato” branding with a calmer sublabel (e.g., “focus + rest”).
- Primary CTA renamed to “Start focus”.
- Secondary CTA renamed to “Begin rest”.
- Settings labels updated to “Focus minutes” and “Rest minutes”.
- Timer display drops glitch styling in favor of a soft pulse.
- Panels and buttons restyled to calm gradients, low-contrast glow, and soft shadows.

## Data Flow
- No changes to message protocol or `TimerState` shape.
- `START` with `mode: 'work'` for focus, `mode: 'break'` for rest.
- Notifications updated to “Focus session complete” and “Rest complete”.

## Error Handling
- Keep existing guards (`clampMinutes`, default state creation).
- Ensure copy aligns with current behavior to avoid semantic mismatch.

## Testing
- Run `npm run compile` for TypeScript safety.
- Manual smoke check: start focus, start rest, pause/resume, save settings.

## Implementation Notes
- Update styles in `shared/style.css`:
  - Replace cyberpunk grid/scanlines with subtle gradients/vignette.
  - Warm neutral palette for focus; soft seafoam palette for rest.
  - Soften neon glows and hover effects.
- Update copy in `entrypoints/popup/App.tsx` and notifications in `shared/timer-service.ts`.
- Adjust README to highlight focus/rest and recovery.

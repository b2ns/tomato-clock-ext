# Cyberpunk Popup UI Design (Tomato Palette)

Date: 2026-01-30

## Context
Reskin the extension popup to a bold cyberpunk aesthetic while keeping the existing timer logic and layout structure. Colors must stay within a tomato spectrum (deep reds to hot oranges), avoiding secondary accent colors.

## Goals
- Deliver a bold cyberpunk HUD feel within a 320px-wide popup.
- Keep layout and functionality intact; only visuals and motion change.
- Use tomato-only palette with high contrast and neon glow cues.

## Non-goals
- No changes to timer behavior, messaging, or state.
- No new dependencies.

## Visual System
- Background: layered gradients (charcoal -> dark maroon -> hot orange bloom).
- Texture: subtle animated grid + scanline overlay.
- Accents: glowing strokes, clipped corners, micro labels, hazard stripes.
- Typography: techno monospaced for timer; compact labels for settings.

## Layout & Components
- Keep two-panel slider (main + settings).
- Main panel:
  - “Holo” timer card with clipped corners and inner stroke.
  - Large neon digits with soft tomato glow.
  - Primary/secondary buttons as neon slabs with hover sweep.
- Settings panel:
  - Console bay with thin borders and micro labels.
  - Inputs styled as terminal fields; toggle becomes neon rail.

## Motion
- High-energy: animated grid drift, scanline sweep, and low-frequency glitch flicker on timer while running.
- Hover effects: soft lift and brighter glow on primary actions.

## Accessibility & Fallbacks
- Maintain readable contrast and button size.
- If clip-path unsupported, card remains rectangular.

## Implementation Notes
- Update Tailwind classes in `entrypoints/popup/App.tsx`.
- Add keyframes/utility styles in `shared/style.css` for grid/scanline/glitch.
- Conditional glow/glitch for running state only.

## Testing
- Manual visual check in popup (main + settings).
- Verify timer states: idle/running/paused still render correctly.

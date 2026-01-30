# Design: Hide Number Input Spinners

## Overview
The goal is to remove the default up/down spinner controls on numeric inputs in the popup settings while preserving native number semantics, validation, and keyboard behavior. This should improve the aesthetic of the cyberpunk UI without changing data flow or timer logic. The change should be minimal, centralized, and consistent across Chromium and Firefox.

## UI/CSS Approach
We will keep the inputs as `type="number"` to retain built-in min/max validation, numeric keyboard behavior, and accessibility semantics. The styling change will be confined to the existing `.neon-input` class in `shared/style.css` so it applies to both work and break inputs without modifying React components. For Firefox, we will set `appearance: textfield` and `-moz-appearance: textfield` on `.neon-input[type='number']` to remove the spinner affordance. For WebKit-based browsers (Chromium/Safari), we will target `.neon-input[type='number']::-webkit-inner-spin-button` and `.neon-input[type='number']::-webkit-outer-spin-button` and set `-webkit-appearance: none` and `margin: 0` to hide them. This is a purely presentational change and does not affect message handling or timer state.

## Error Handling and Data Flow
No new logic is introduced, and no changes are needed in message flow or state handling. Existing min/max attributes and clamp logic remain the source of truth. If users enter out-of-range values, the current validation behavior is unchanged.

## Testing
Manual verification in the popup UI:
- Spinners no longer appear on the number inputs.
- Arrow keys and scroll wheel still adjust values as before.
- Min/max constraints still prevent invalid values.
- Behavior is consistent in Chromium-based browsers and Firefox.

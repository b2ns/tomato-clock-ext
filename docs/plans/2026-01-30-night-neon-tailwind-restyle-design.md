# Night Neon Tailwind Restyle Design

## Overview

Restyle the popup UI for the Tomato Clock extension using Tailwind utility classes only. Keep the existing layout, copy, and behavior exactly the same. Replace the current App.css styles with a new "night neon" theme: deep navy surfaces, neon cyan/blue accents, subtle glow, and glass-like panels.

## Goals

- Preserve current structure and interactions; change styling only.
- Use Tailwind utilities in `entrypoints/popup/App.tsx` instead of `App.css`.
- Maintain readability and focus in a small popup surface (320px wide).

## Visual Direction

- Main card: gradient background from slate/indigo with soft glow shadow, rounded corners.
- Badge: pill with translucent cyan background, thin cyan border, small uppercase tracking.
- Mode label: cool indigo text for contrast against the header.
- Timer panel: glassy block with subtle border and large, bright time display.
- Status label: uppercase tracking with cyan accent.
- Inputs: translucent dark fields with soft borders and cyan focus rings.
- Buttons: primary gradient cyan-to-blue for Start, darker secondary for Pause/Resume, and a ghost reset with neon outline.

## Component Mapping

- `main.app` -> Tailwind classes for grid layout, padding, gradient background, and shadow.
- Header elements -> flex utilities and neon badge styling.
- Timer section -> centered block with glass background and typography.
- Controls -> stacked inputs with label styling and focus rings.
- Actions -> two-column grid with button variants and disabled states.

## Quality & Accessibility

- Keep labels tied to inputs.
- Preserve focus visibility via Tailwind focus rings.
- Ensure text contrast remains readable on dark surfaces.


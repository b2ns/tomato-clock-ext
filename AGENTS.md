# Repository Guidelines

This repository is a WXT + React browser extension template. Use the guidance below when contributing.

## How to use the WXT

here is the [doc](https://wxt.dev/knowledge/index.json)

## Project Structure & Module Organization

- `entrypoints/` holds extension surfaces:
  - `background.ts` for background logic
  - `content.ts` for content scripts
  - `popup/` for the UI (`index.html`, `App.tsx`, styles)
- `public/` contains static assets and icons (e.g., `public/icon/128.png`).
- `assets/` contains shared assets (e.g., `assets/react.svg`).
- Root config: `wxt.config.ts`, `tsconfig.json`, `package.json`.

## Build, Test, and Development Commands

- `npm run dev` — start WXT dev server for Chromium-based browsers.
- `npm run dev:firefox` — start dev server targeting Firefox.
- `npm run build` — production build for Chromium-based browsers.
- `npm run build:firefox` — production build for Firefox.
- `npm run zip` — package extension for release (Chromium).
- `npm run zip:firefox` — package extension for release (Firefox).
- `npm run format` — format the codebase with Prettier.
- `npm run compile` — TypeScript typecheck only.
- `npm install` runs `wxt prepare` via `postinstall` to generate WXT artifacts.

## Coding Style & Naming Conventions

- Use Prettier for formatting (includes organize-imports and Tailwind plugins).
- Run `npm run format` before PRs; let Prettier decide indentation, quotes, and line width.
- React components in PascalCase (e.g., `App.tsx`).
- Keep entrypoints grouped by surface (background/content/popup).
- No linter is configured; follow existing conventions for structure and naming.

## Testing Guidelines

- No test framework is configured yet.
- Use `npm run compile` as a minimum check before PRs.
- If you add tests in the future, keep them near related modules (e.g., `entrypoints/popup/__tests__/`).

## Commit & Pull Request Guidelines

- There is no commit history yet, so conventions are not established.
- Recommended default: Conventional Commits (e.g., `feat: add timer toggle`).
- PRs should include a clear description and screenshots for UI changes (popup).

## Configuration & Security Tips

- Use the `*:firefox` scripts for Firefox-specific builds.
- Do not commit secrets; store keys in local env files if added later.

# Global Shortcut Commands Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add global keyboard shortcuts for focus, rest, and pause/resume with Ctrl+Shift defaults, handled by the background script.

**Architecture:** Define three WebExtension commands in the manifest. The background listens for `browser.commands.onCommand` and maps each command to existing timer service actions, using stored custom durations and current status to pick pause vs resume.

**Tech Stack:** TypeScript, WXT (manifest), WebExtension Commands API.

### Task 1: Define manifest commands with default shortcuts

**Files:**

- Modify: `wxt.config.ts`

**Step 1: Add commands to the manifest**

```ts
  manifest: {
    name: 'Tomato',
    description: 'a pomodoro clock',
    permissions: ['alarms', 'storage', 'notifications', 'offscreen'],
    commands: {
      focus: {
        suggested_key: { default: 'Ctrl+Shift+F', mac: 'Ctrl+Shift+F' },
        description: 'Start focus session',
      },
      rest: {
        suggested_key: { default: 'Ctrl+Shift+R', mac: 'Ctrl+Shift+R' },
        description: 'Start rest session',
      },
      'toggle-pause': {
        suggested_key: { default: 'Ctrl+Shift+P', mac: 'Ctrl+Shift+P' },
        description: 'Pause or resume timer',
      },
    },
  },
```

**Step 2: Manual check**

Open the browser’s extension shortcuts UI and confirm the three commands appear with defaults.

**Step 3: Commit**

```bash
git add wxt.config.ts
git commit -m "feat: add command shortcuts"
```

### Task 2: Handle command actions in the background

**Files:**

- Modify: `entrypoints/background.ts`

**Step 1: Add a command handler**

```ts
  const startWithMode = async (mode: 'work' | 'break') => {
    const current = await service.handleMessage({ type: 'GET_STATE' })
    await service.handleMessage({
      type: 'START',
      payload: { work: current.custom.work, break: current.custom.break },
      mode,
    })
  }

  const togglePause = async () => {
    const current = await service.handleMessage({ type: 'GET_STATE' })
    if (current.status === 'running') {
      await service.handleMessage({ type: 'PAUSE' })
    } else if (current.status === 'paused') {
      await service.handleMessage({ type: 'RESUME' })
    }
  }

  browser.commands.onCommand.addListener((command) => {
    void (async () => {
      if (command === 'focus') {
        await startWithMode('work')
        return
      }
      if (command === 'rest') {
        await startWithMode('break')
        return
      }
      if (command === 'toggle-pause') {
        await togglePause()
      }
    })()
  })
```

**Step 2: Manual check**

Use the shortcuts to confirm focus/rest start and pause/resume toggles when the popup is closed.

**Step 3: Commit**

```bash
git add entrypoints/background.ts
git commit -m "feat: handle command shortcuts"
```

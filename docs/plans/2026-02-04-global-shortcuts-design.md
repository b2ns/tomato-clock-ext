# Global Shortcut Commands Design

## Goal
Add global extension keyboard shortcuts to start a focus session, start a rest session, and toggle pause/resume without opening the popup. Provide default shortcuts with a Ctrl+Shift prefix while allowing users to customize them in the browser’s keyboard shortcuts settings.

## Approach
Define three WebExtension commands in the manifest (`focus`, `rest`, `toggle-pause`) with `suggested_key` defaults. Use a Ctrl+Shift prefix for all platforms, including macOS, per preference. WXT will merge the `commands` block into the final manifest. Each command will have a short description for the browser shortcuts UI.

In the background script, listen to `browser.commands.onCommand` and map each command to existing timer behavior. The handler will request current timer state to read custom durations and status. For `focus` and `rest`, it will call the same `START` path as the popup, supplying the current custom durations and the desired mode. For `toggle-pause`, it will pause when running, resume when paused, and no-op when idle (matching the popup’s disabled pause button).

## Error Handling
Commands should be best-effort. If the timer is idle and `toggle-pause` is triggered, do nothing. All actions run through the timer service, keeping alarms, badge updates, and storage in sync.

## Manual Verification
- Use the browser shortcuts UI to confirm defaults: `Ctrl+Shift+F`, `Ctrl+Shift+R`, `Ctrl+Shift+P`.
- Trigger focus: timer starts focus with custom durations.
- Trigger rest: timer starts rest with custom durations.
- Trigger toggle while running: timer pauses.
- Trigger toggle while paused: timer resumes.
- Trigger toggle while idle: no change.

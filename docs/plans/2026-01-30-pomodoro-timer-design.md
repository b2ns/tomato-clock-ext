# Pomodoro Timer Extension Design

## Overview

Build a WXT + React Chrome extension that runs a Pomodoro-style timer. The timer is set from the popup UI, continues running when the popup is closed, persists across browser restarts, and triggers a system notification when time expires. Defaults are 25 minutes work / 5 minutes break, with user-customizable durations.

## Architecture & Data Flow

The background service worker is the source of truth for timer state. The popup UI only reads and updates state via messages or storage. Timer completion is scheduled with `chrome.alarms` and persistence uses `chrome.storage.local`.

Suggested state shape:

```
{
  mode: "work" | "break",
  status: "idle" | "running" | "paused",
  durationMs: number,
  remainingMs: number | null,
  endAt: number | null,
  preset: { work: 25, break: 5 },
  custom: { work: number, break: number }
}
```

Flow:
1) User sets durations in popup and clicks Start.  
2) Popup sends `START` to background.  
3) Background persists state, sets `endAt = now + durationMs`, and schedules `chrome.alarms`.  
4) Alarm fires -> background marks segment complete, shows notification, and transitions to next segment or idle.  
5) On startup, background loads state and re-creates alarms or fires completion if overdue.  

## Permissions & Configuration

Add permissions in `wxt.config.ts`:

- `alarms` for scheduling
- `storage` for persistence
- `notifications` for system notifications

No host permissions are required for this feature.

## Components & Messaging

Components:
- `entrypoints/background.ts`: owns state, schedules alarms, handles notifications.
- `entrypoints/popup/`: UI for configuring durations and controlling Start/Pause/Resume/Reset.
- Optional shared module for state types and message enums.

Message protocol (examples):
- `GET_STATE`
- `START` (with durations)
- `PAUSE`
- `RESUME`
- `RESET`
- `SET_PRESET`

Popup updates UI by reading storage on open, subscribing to `storage.onChanged`, or polling at 1s intervals.

## Edge Cases & Error Handling

- Startup rehydrate: if `endAt` is in the past, fire completion immediately.
- Pause: store `remainingMs`, clear alarms.
- Resume: recompute `endAt`, set alarm again.
- Reset: clear all timing fields and alarms.
- Clamp user input to reasonable bounds (e.g., 1–180 minutes).
- Log notification errors if permissions are missing.

## Testing Plan

Manual checks:
- Start timer, close popup, confirm countdown completes and notification fires.
- Restart Chrome and ensure timer state persists.
- Pause/resume behavior and reset behavior.
- Verify work -> break transition or idle behavior.

Optional unit tests (future):
- State transition tests for START/PAUSE/RESUME/RESET.
- Alarm scheduling logic around overdue timers.

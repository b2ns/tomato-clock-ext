import type { TimerAdapter } from './timer-service'
import type { TimerState } from './timer'

export const STORAGE_KEY = 'timerState'
export const ALARM_NAME = 'pomodoro'
const OFFSCREEN_URL = 'offscreen.html'

type OffscreenApi = {
  hasDocument?: () => Promise<boolean>
  createDocument: (options: {
    url: string
    reasons: string[]
    justification: string
  }) => Promise<void>
}

const getOffscreen = () =>
  (chrome as typeof chrome & { offscreen?: OffscreenApi }).offscreen

let offscreenCreating: Promise<void> | null = null

const ensureOffscreenDocument = async () => {
  const offscreen = getOffscreen()
  if (!offscreen) return
  if (offscreen.hasDocument) {
    const exists = await offscreen.hasDocument()
    if (exists) return
  }
  if (offscreenCreating) return offscreenCreating
  offscreenCreating = offscreen
    .createDocument({
      url: chrome.runtime.getURL(OFFSCREEN_URL),
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play timer completion sound',
    })
    .catch(() => undefined)
    .finally(() => {
      offscreenCreating = null
    })
  return offscreenCreating
}

const getStorage = (): Promise<Record<string, TimerState | undefined>> =>
  new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => resolve(result))
  })

const setStorage = (state: TimerState): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: state }, () => resolve())
  })

export function createChromeAdapter(): TimerAdapter {
  return {
    now: () => Date.now(),
    async getStoredState() {
      const result = await getStorage()
      return result[STORAGE_KEY] ?? null
    },
    async setStoredState(state) {
      await setStorage(state)
    },
    scheduleAlarm: (when) =>
      new Promise((resolve) => {
        chrome.alarms.clear(ALARM_NAME, () => {
          if (when) {
            chrome.alarms.create(ALARM_NAME, { when })
          }
          resolve()
        })
      }),
    notify: (title, message) =>
      new Promise((resolve) => {
        chrome.notifications.create(
          {
            type: 'basic',
            iconUrl: 'icon/128.png',
            title,
            message,
          },
          () => resolve(),
        )
      }),
    playSound: async () => {
      await ensureOffscreenDocument()
      chrome.runtime.sendMessage({ type: 'PLAY_SOUND' }, () => void 0)
    },
  }
}

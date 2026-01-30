import { browser } from '#imports'
import type { TimerState } from './timer'
import type { TimerAdapter } from './timer-service'

export const STORAGE_KEY = 'timerState'
export const ALARM_NAME = browser.runtime.getManifest().name
export const NOTIFICATION_ID = `${ALARM_NAME}-complete`
const OFFSCREEN_URL = '/offscreen.html'

type OffscreenApi = {
  hasDocument?: () => Promise<boolean>
  createDocument: (options: {
    url: string
    reasons: string[]
    justification: string
  }) => Promise<void>
}

const getOffscreen = () => (browser as typeof browser & { offscreen?: OffscreenApi }).offscreen

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
      url: browser.runtime.getURL(OFFSCREEN_URL),
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
    browser.storage.local.get(STORAGE_KEY, (result: any) => resolve(result))
  })

const setStorage = (state: TimerState): Promise<void> =>
  new Promise((resolve) => {
    browser.storage.local.set({ [STORAGE_KEY]: state }, () => resolve())
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
        browser.alarms.clear(ALARM_NAME, () => {
          if (when) {
            browser.alarms.create(ALARM_NAME, { when })
          }
          resolve()
        })
      }),
    notify: (title, message) =>
      new Promise((resolve) => {
        browser.notifications.create(
          NOTIFICATION_ID,
          {
            type: 'basic',
            iconUrl: 'icons/128.png',
            title,
            message,
          },
          () => resolve(),
        )
      }),
    playSound: async () => {
      await ensureOffscreenDocument()
      browser.runtime.sendMessage({ type: 'PLAY_SOUND' }, () => void 0)
    },
  }
}

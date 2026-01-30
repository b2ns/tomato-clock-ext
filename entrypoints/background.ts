import { browser, defineBackground } from '#imports'
import { ALARM_NAME, NOTIFICATION_ID, createChromeAdapter } from '@/shared/chrome-adapter'
import type { TimerMessage, TimerResponse } from '@/shared/messages'
import { createTimerService } from '@/shared/timer-service'

export default defineBackground(() => {
  const adapter = createChromeAdapter()
  const service = createTimerService(adapter)
  void service.initialize()

  browser.runtime.onInstalled.addListener(() => void service.initialize())
  browser.runtime.onStartup.addListener(() => void service.initialize())

  browser.runtime.onMessage.addListener((message: TimerMessage, _sender, sendResponse) => {
    if (message?.type === 'PLAY_SOUND') {
      void adapter.playSound()
      sendResponse?.(undefined)
      return true
    }
    service.handleMessage(message).then((state) => sendResponse({ state } satisfies TimerResponse))
    return true
  })

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM_NAME) return
    void service.handleAlarm()
  })

  browser.notifications.onClicked.addListener((notificationId) => {
    if (notificationId !== NOTIFICATION_ID) return
    void service.handleNotificationClick()
  })
})

import { defineBackground } from 'wxt/utils/define-background'
import { createChromeAdapter, ALARM_NAME } from '@/shared/chrome-adapter'
import { createTimerService } from '@/shared/timer-service'
import type { TimerMessage, TimerResponse } from '@/shared/messages'

export default defineBackground(() => {
  const service = createTimerService(createChromeAdapter())
  void service.initialize()

  chrome.runtime.onInstalled.addListener(() => void service.initialize())
  chrome.runtime.onStartup.addListener(() => void service.initialize())

  chrome.runtime.onMessage.addListener(
    (message: TimerMessage, _sender, sendResponse) => {
      service
        .handleMessage(message)
        .then((state) => sendResponse({ state } satisfies TimerResponse))
      return true
    },
  )

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM_NAME) return
    void service.handleAlarm()
  })
})

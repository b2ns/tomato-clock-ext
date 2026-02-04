import { browser, defineBackground } from '#imports'
import { ALARM_NAME, NOTIFICATION_ID, createChromeAdapter } from '@/shared/chrome-adapter'
import type { TimerMessage, TimerResponse } from '@/shared/messages'
import { createTimerService } from '@/shared/timer-service'

export default defineBackground(() => {
  const adapter = createChromeAdapter()
  const service = createTimerService(adapter)
  void service.initialize()

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
      return
    }
    if (current.status === 'paused') {
      await service.handleMessage({ type: 'RESUME' })
    }
  }

  browser.runtime.onInstalled.addListener(() => void service.initialize())
  browser.runtime.onStartup.addListener(() => void service.initialize())

  browser.runtime.onMessage.addListener((message: TimerMessage, _sender, sendResponse) => {
    console.log('dsp messages', message)
    if (message?.type === 'PLAY_SOUND') {
      void adapter.playSound()
      sendResponse?.(undefined)
      return true
    }
    service.handleMessage(message).then((state) => sendResponse({ state } satisfies TimerResponse))
    return true
  })

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

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM_NAME) return
    void service.handleAlarm()
  })

  browser.notifications.onClicked.addListener((notificationId) => {
    if (notificationId !== NOTIFICATION_ID) return
    void service.handleNotificationClick()
  })
})

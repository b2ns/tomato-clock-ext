import App from '@/entrypoints/popup/App'
import { createDefaultState } from '@/shared/timer'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

function setupChrome(state = createDefaultState()) {
  const sendMessage = vi.fn((_message, cb) => cb?.({ state }))
  const listeners: ((changes: any, area: string) => void)[] = []

  ;(globalThis as any).chrome = {
    runtime: { sendMessage },
    storage: {
      onChanged: {
        addListener: (fn: any) => listeners.push(fn),
        removeListener: (fn: any) => listeners.splice(listeners.indexOf(fn), 1),
      },
    },
  }

  return { sendMessage }
}

describe('popup App', () => {
  test('renders countdown and controls', async () => {
    setupChrome()
    render(<App />)
    const countdown = await screen.findByText('25:00')
    expect(countdown).toBeInTheDocument()
    expect(countdown.className).toContain('text-6xl')
    expect(screen.getByRole('main').className).toContain('h-[310px]')
    expect(await screen.findByRole('button', { name: /start/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument()
  })

  test('clicking Start sends START message', async () => {
    const { sendMessage } = setupChrome()
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /start/i }))
    const startCall = sendMessage.mock.calls.find(([message]) => message.type === 'START')
    expect(startCall?.[0]).toMatchObject({
      type: 'START',
      payload: { work: 25, break: 5 },
      mode: 'work',
    })
  })

  test('clicking Stop sends RESET message when running', async () => {
    const runningState = {
      ...createDefaultState(),
      status: 'running',
      endAt: Date.now() + 60_000,
    }
    const { sendMessage } = setupChrome(runningState)
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /stop/i }))
    const resetCall = sendMessage.mock.calls.find(([message]) => message.type === 'RESET')
    expect(resetCall).toBeTruthy()
  })

  test('clicking Resume sends RESUME message when paused', async () => {
    const pausedState = {
      ...createDefaultState(),
      status: 'paused',
      remainingMs: 90_000,
    }
    const { sendMessage } = setupChrome(pausedState)
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /resume/i }))
    const resumeCall = sendMessage.mock.calls.find(([message]) => message.type === 'RESUME')
    expect(resumeCall).toBeTruthy()
  })

  test('menu reveals settings and toggles sound', async () => {
    const { sendMessage } = setupChrome()
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /open settings/i }))
    const workField = await screen.findByLabelText(/work minutes/i)
    expect(workField).toBeInTheDocument()
    expect(screen.getByLabelText(/break minutes/i)).toBeInTheDocument()
    const soundToggle = screen.getByLabelText(/spell sound/i)
    await user.click(soundToggle)
    const soundCall = sendMessage.mock.calls.find(([message]) => message.type === 'SET_SOUND')
    expect(soundCall?.[0]).toMatchObject({ type: 'SET_SOUND' })
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(saveButton)
    const settingsPanel = workField.closest('section')
    expect(settingsPanel?.getAttribute('aria-hidden')).toBe('true')
  })

  test('preview button triggers sound demo', async () => {
    const { sendMessage } = setupChrome()
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /open settings/i }))
    const previewButton = await screen.findByRole('button', { name: /play sound preview/i })
    await user.click(previewButton)
    const previewCall = sendMessage.mock.calls.find(([message]) => message.type === 'PLAY_SOUND')
    expect(previewCall).toBeTruthy()
  })

  test('buttons sit at the bottom of the timer panel', async () => {
    setupChrome()
    render(<App />)
    const startButton = await screen.findByRole('button', { name: /start/i })
    const buttonGroup = startButton.parentElement
    expect(buttonGroup?.className).toContain('mt-auto')
  })

  test('panels do not add extra left/right padding', async () => {
    setupChrome()
    render(<App />)
    const settingsTitle = await screen.findByText('Settings')
    const settingsPanel = settingsTitle.closest('section')
    expect(settingsPanel?.className).not.toContain('pl-4')
    const countdown = await screen.findByText('25:00')
    const timerPanel = countdown.closest('section')
    expect(timerPanel?.className).not.toContain('pr-4')
  })
})

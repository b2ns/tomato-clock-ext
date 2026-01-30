import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import App from '@/entrypoints/popup/App'
import { createDefaultState } from '@/shared/timer'

function setupChrome(state = createDefaultState()) {
  const sendMessage = vi.fn((_message, cb) => cb?.({ state }))
  const listeners: ((changes: any, area: string) => void)[] = []

  ;(globalThis as any).chrome = {
    runtime: { sendMessage },
    storage: {
      onChanged: {
        addListener: (fn: any) => listeners.push(fn),
        removeListener: (fn: any) =>
          listeners.splice(listeners.indexOf(fn), 1),
      },
    },
  }

  return { sendMessage }
}

describe('popup App', () => {
  test('renders default durations and timer', async () => {
    setupChrome()
    render(<App />)
    expect(await screen.findByText('25:00')).toBeInTheDocument()
    expect(screen.getByLabelText(/work minutes/i)).toHaveValue(25)
    expect(screen.getByLabelText(/break minutes/i)).toHaveValue(5)
  })

  test('clicking Start sends message', async () => {
    const { sendMessage } = setupChrome()
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /start/i }))
    expect(sendMessage).toHaveBeenCalled()
  })
})

import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: false,
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
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

  //@ts-ignore
  vite: () => {
    return {
      plugins: [tailwindcss()],
    }
  },
})

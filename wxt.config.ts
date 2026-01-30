import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: false,
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  manifest: {
    name: 'pomodoro',
    description: 'a pomodoro timmer',
    permissions: ['alarms', 'storage', 'notifications', 'offscreen'],
  },

  //@ts-ignore
  vite: () => {
    return {
      plugins: [tailwindcss()],
    }
  },
})

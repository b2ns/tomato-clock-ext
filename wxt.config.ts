import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: false,
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons', '@wxt-dev/i18n/module'],
  manifest: {
    name: '__MSG_ext_name__',
    description: '__MSG_ext_desc__',
    default_locale: 'en',
    permissions: ['alarms', 'storage', 'notifications', 'offscreen'],
    commands: {
      focus: {
        suggested_key: { default: 'Ctrl+Shift+F', mac: 'Ctrl+Shift+F' },
        description: '__MSG_command_focus__',
      },
      rest: {
        suggested_key: { default: 'Ctrl+Shift+R', mac: 'Ctrl+Shift+R' },
        description: '__MSG_command_rest__',
      },
      'toggle-pause': {
        suggested_key: { default: 'Ctrl+Shift+P', mac: 'Ctrl+Shift+P' },
        description: '__MSG_command_toggle_pause__',
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

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { SHEET_URL } from './src/config/config.js'

/** Path on script.google.com for the Web App (used by dev proxy below). */
function appsScriptWebAppPathname() {
  const sheet = String(SHEET_URL ?? '').trim()
  try {
    if (!sheet) return '/macros/s/invalid/exec'
    const p = new URL(sheet).pathname.replace(/\/+$/, '')
    return /\/exec$/i.test(p) ? p : `${p}/exec`
  } catch {
    return '/macros/s/invalid/exec'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Required so asset paths work when loaded from the Capacitor WebView (file://).
  base: './',
  server: {
    proxy: {
      // Browser → same origin (no CORS); dev server forwards POST to Apps Script.
      '/__sagideep_sheet_auth': {
        target: 'https://script.google.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => appsScriptWebAppPathname(),
      },
    },
  },
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {
  SAGIDEEP_PLAYLISTS,
  SAGIDEEP_TRACKING,
  SAGIDEEP_USERS,
  SAGIDEEP_MOBILE_UPDATES,
  SHEET_IP_TRACK_URL,
  SHEET_URL,
} from './src/config/config.js'

/** Path on script.google.com for the Web App (used by dev proxy below). */
function webAppPathnameFromExecUrl(fullUrl) {
  const sheet = String(fullUrl ?? '').trim()
  try {
    if (!sheet) return '/macros/s/invalid/exec'
    const p = new URL(sheet).pathname.replace(/\/+$/, '')
    return /\/exec$/i.test(p) ? p : `${p}/exec`
  } catch {
    return '/macros/s/invalid/exec'
  }
}

/** Apps Script often 302s to script.googleusercontent.com; follow in Node so the browser never leaves localhost. */
const appsScriptProxy = (rewritePath) => ({
  target: 'https://script.google.com',
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  rewrite: rewritePath,
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Required so asset paths work when loaded from the Capacitor WebView (file://).
  base: './',
  server: {
    proxy: {
      // Browser → same origin (no CORS); dev server forwards to Apps Script.
      '/__sagideep_sheet_auth': appsScriptProxy(() => webAppPathnameFromExecUrl(SHEET_URL)),
      '/__sagideep_sheet_ip_track': appsScriptProxy(() =>
        webAppPathnameFromExecUrl(SHEET_IP_TRACK_URL || SHEET_URL),
      ),
      '/__sagideep_users': appsScriptProxy(() => webAppPathnameFromExecUrl(SAGIDEEP_USERS)),
      '/__sagideep_playlists': appsScriptProxy(() => webAppPathnameFromExecUrl(SAGIDEEP_PLAYLISTS)),
      '/__sagideep_mobile_updates': appsScriptProxy(() => webAppPathnameFromExecUrl(SAGIDEEP_MOBILE_UPDATES)),
      '/__sagideep_tracking': appsScriptProxy(() => webAppPathnameFromExecUrl(SAGIDEEP_TRACKING)),
    },
  },
})

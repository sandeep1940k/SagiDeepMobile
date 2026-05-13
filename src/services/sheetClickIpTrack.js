/**
 * IP tracking: POST **JSON** to your Web App (same as signup/login): `{ action: "trackIP", ip }`.
 * Your `doPost` must use `JSON.parse(e.postData.contents)` — not `e.parameter` (form-urlencoded).
 * Uses `postWebAppJson` → `SHEET_URL` or optional `VITE_SHEET_IP_TRACK_URL` (see `config.js`).
 */

import {
  SHEET_IP_TRACK_ACTION,
  SHEET_IP_TRACK_ENABLED,
  SHEET_IP_TRACK_URL,
} from '../config/config.js'
import { postWebAppJson } from './userAuth.js'

/** Throttle so rapid taps do not flood the script. */
const MIN_MS_BETWEEN_POSTS = 2500

let lastThrottleAt = 0
let inFlight = false

/**
 * Format like `13-5-2026 9:20 AM` (optional; only if you later send `dateTime` in JSON from the client).
 * @param {Date} d
 */
export function formatTrackDateTime(d) {
  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  let h24 = d.getHours()
  const m = d.getMinutes()
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  const mm = m < 10 ? `0${m}` : String(m)
  return `${day}-${month}-${year} ${h12}:${mm} ${ampm}`
}

export async function fetchPublicIp() {
  const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
  if (!r.ok) throw new Error(`ipify ${r.status}`)
  const j = await r.json()
  const ip = String(j?.ip ?? '').trim()
  if (!ip) throw new Error('ipify empty')
  return ip
}

/**
 * POST JSON `{ action, ip }` like signup/login. Throttled.
 * @returns {Promise<void>}
 */
export async function reportSheetClickIpTrack() {
  if (!SHEET_IP_TRACK_ENABLED) return

  const now = Date.now()
  if (now - lastThrottleAt < MIN_MS_BETWEEN_POSTS || inFlight) return

  lastThrottleAt = now
  inFlight = true
  try {
    const ip = await fetchPublicIp()
    const payload = {
      action: SHEET_IP_TRACK_ACTION,
      ip,
    }
    if (import.meta.env.VITE_SHEET_IP_TRACK_SEND_DATETIME === '1') {
      payload.dateTime = formatTrackDateTime(new Date())
    }
    const override = String(SHEET_IP_TRACK_URL || '').trim()
    await postWebAppJson(payload, {
      useConfigSheetUrlOnly: true,
      ...(override ? { sheetUrlOverride: override } : {}),
    })
    if (import.meta.env.DEV && import.meta.env.VITE_SHEET_IP_TRACK_DEBUG === '1') {
      console.info('[sheet ip track] ok', payload.action)
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[sheet ip track]', e)
    }
  } finally {
    inFlight = false
  }
}

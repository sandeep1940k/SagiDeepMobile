/**
 * Free logging: FormData POST to Apps Script (same pattern as a plain HTML form).
 *
 * URL: `src/config/playlistSheetLogUrl.js` → PLAYLIST_SHEET_LOG_URL
 *
 * Sheet tab: Sheet1. Five columns (A–E): Name | Email | IP Address | Playlist Name | Time
 *   - Mobile app: writes C–E (A–B left blank on new row). If column C already has the same IP,
 *     only column E is updated (no new row).
 *   - HTML test form (name/email): name | email | (blank) | (blank) | time — always a new row
 *
 * App sends `time` as local device string: `10-5-2026 11:13 PM` (day-month-year, 12h) via formatDateTime().
 *
 * Replace your Apps Script with this so BOTH the app and public/google-sheet-save-test.html work:
 *
 *   function formatLogTime_(isoOrEmpty) {
 *     var d = isoOrEmpty ? new Date(isoOrEmpty) : new Date();
 *     if (isNaN(d.getTime())) d = new Date();
 *     return Utilities.formatDate(d, Session.getScriptTimeZone(), 'd-M-yyyy h:mm a');
 *   }
 *
 *   function timeCell_(p) {
 *     var t = (p.time || '').trim();
 *     if (!t) return formatLogTime_('');
 *     if (/^\d{4}-\d{2}-\d{2}T/.test(t)) return formatLogTime_(t);
 *     return t;
 *   }
 *
 *   // findRowByIp_: returns 1-based row index, or 0 if IP not in column C
 *   function findRowByIp_(sheet, ip) {
 *     var t = String(ip || '').trim();
 *     if (!t) return 0;
 *     var last = sheet.getLastRow();
 *     if (last < 2) return 0;
 *     var values = sheet.getRange(2, 3, last, 3).getValues();
 *     for (var i = 0; i < values.length; i++) {
 *       if (String(values[i][0] || '').trim() === t) return i + 2;
 *     }
 *     return 0;
 *   }
 *
 *   function doPost(e) {
 *     var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
 *     var p = e.parameter;
 *     var secret = PropertiesService.getScriptProperties().getProperty('LOG_SECRET');
 *     if (secret && (Object.prototype.hasOwnProperty.call(p, 'playlistId') || Object.prototype.hasOwnProperty.call(p, 'playlistid')) && p.secret !== secret) {
 *       return ContentService.createTextOutput('denied');
 *     }
 *     var fromApp = Object.prototype.hasOwnProperty.call(p, 'playlistId')
 *       || Object.prototype.hasOwnProperty.call(p, 'playlistid');
 *     if (fromApp) {
 *       var pl = p.playlistname || p.playlist || p.playlistName || '';
 *       var ipVal = p.ip || '';
 *       var timeVal = timeCell_(p);
 *       var row = findRowByIp_(sheet, ipVal);
 *       if (row > 0) {
 *         sheet.getRange(row, 5).setValue(timeVal);
 *       } else {
 *         sheet.appendRow(['', '', ipVal, pl, timeVal]);
 *       }
 *     } else {
 *       sheet.appendRow([p.name || '', p.email || '', '', '', timeCell_(p)]);
 *     }
 *     return ContentService.createTextOutput('Success');
 *   }
 *
 * Then: Deploy → Manage deployments → Edit → New version → Deploy.
 */

import { Capacitor } from '@capacitor/core'
import {
  PLAYLIST_LOG_CUSTOM_FIELDS,
  PLAYLIST_SHEET_LOG_SECRET,
  PLAYLIST_SHEET_LOG_URL,
} from '../config/playlistSheetLogUrl.js'

function rawPlaylistLogUrl() {
  const fromEnv = String(import.meta.env.VITE_PLAYLIST_LOG_URL ?? '').trim()
  if (fromEnv) return fromEnv
  return String(PLAYLIST_SHEET_LOG_URL ?? '').trim()
}

function rawPlaylistLogSecret() {
  const fromEnv = String(import.meta.env.VITE_PLAYLIST_LOG_SECRET ?? '').trim()
  if (fromEnv) return fromEnv
  return String(PLAYLIST_SHEET_LOG_SECRET ?? '').trim()
}

/** @returns {{ ok: true, url: string } | { ok: false, reason: string }} */
function validateLogUrl(raw) {
  const s = String(raw ?? '').trim()
  if (!s) {
    return {
      ok: false,
      reason:
        'No logging URL: set `PLAYLIST_SHEET_LOG_URL` in `src/config/playlistSheetLogUrl.js` (or VITE_PLAYLIST_LOG_URL in `.env`), then rebuild.',
    }
  }
  if (/docs\.google\.com\/spreadsheets/i.test(s)) {
    return {
      ok: false,
      reason:
        'Use the Apps Script Web app URL (script.google.com/.../exec), not the Sheet editor link.',
    }
  }
  let parsed
  try {
    parsed = new URL(s)
  } catch {
    return { ok: false, reason: 'Playlist log URL is not a valid URL.' }
  }
  if (!/^script\.google\.com$/i.test(parsed.hostname)) {
    return {
      ok: false,
      reason: `Expected script.google.com, got "${parsed.hostname}".`,
    }
  }
  if (!/\/exec/i.test(parsed.pathname)) {
    return {
      ok: false,
      reason: 'URL must include /exec (Web app deployment).',
    }
  }
  return { ok: true, url: s.replace(/\/+$/, '') }
}

/** Local device time, e.g. `10-5-2026 11:13 PM` (day-month-year, 12-hour). */
function formatDateTime() {
  const now = new Date()
  const day = now.getDate()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  let hours = now.getHours()
  const minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const mm = minutes.toString().padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${mm} ${ampm}`
}

function buildLogFormData(playlistId, playlistName, ip) {
  const fd = new FormData()
  const time = formatDateTime()
  const pl = String(playlistName || '')
  const id = String(playlistId || '')
  fd.append('ip', String(ip || ''))
  // GAS e.parameter keys are often lowercased; send several aliases so column B fills reliably.
  fd.append('playlist', pl)
  fd.append('playlistname', pl)
  fd.append('playlistName', pl)
  fd.append('time', time)
  fd.append('playlistid', id)
  fd.append('playlistId', id)
  const secret = rawPlaylistLogSecret()
  if (secret) fd.append('secret', secret)
  if (import.meta.env.VITE_PLAYLIST_LOG_EXTRA === '1') {
    fd.append('userAgent', String(typeof navigator !== 'undefined' ? navigator.userAgent : '').slice(0, 300))
    fd.append('platform', Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web')
  }
  const custom = PLAYLIST_LOG_CUSTOM_FIELDS
  if (custom && typeof custom === 'object') {
    for (const [k, v] of Object.entries(custom)) {
      if (v == null || k === '') continue
      fd.append(k, String(v))
    }
  }
  return fd
}

async function sendLogForm(url, formData) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
      body: formData,
    })
    if (import.meta.env.DEV && import.meta.env.VITE_PLAYLIST_LOG_DEBUG === '1') {
      console.info('[playlist log] response', await r.text())
    }
  } catch (e) {
    if (import.meta.env.DEV && import.meta.env.VITE_PLAYLIST_LOG_DEBUG === '1') {
      console.warn('[playlist log] fetch failed', e)
    }
  }
}

/**
 * @param {{ playlistId: string, playlistName: string }} opts
 */
export async function logPlaylistOpen(opts) {
  const validated = validateLogUrl(rawPlaylistLogUrl())
  if (!validated.ok) {
    console.warn('[playlist log]', validated.reason)
    return
  }
  const url = validated.url

  const { playlistId, playlistName } = opts

  let ip = ''
  try {
    const ctrl = new AbortController()
    const tid = window.setTimeout(() => ctrl.abort(), 1200)
    const r = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal })
    window.clearTimeout(tid)
    if (r.ok) {
      const j = await r.json()
      ip = String(j?.ip || '')
    }
  } catch {
    /* row still written with empty IP */
  }

  const formData = buildLogFormData(playlistId, playlistName, ip)

  if (import.meta.env.DEV && import.meta.env.VITE_PLAYLIST_LOG_DEBUG === '1') {
    console.info('[playlist log] POST FormData', url.split('?')[0], {
      ip: ip || '(empty)',
      playlistName,
      playlistId,
      secret: rawPlaylistLogSecret() ? '***' : undefined,
    })
  }

  void sendLogForm(url, formData)
}

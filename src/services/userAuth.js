/**
 * POST JSON to your Apps Script Web App (same idea as a plain fetch + JSON.stringify).
 * Expects `{ success: true|false, message?: string }` and optional `{ user }`.
 */

import { SAGIDEEP_USERS, SAGIDEEP_PLAYLISTS, SAGIDEEP_MOBILE_UPDATES, SAGIDEEP_TRACKING, SHEET_URL } from '../config/config.js'
import { USER_AUTH_SECRET, USER_AUTH_SHEET_URL } from '../config/userAuthSheetUrl.js'
import { postAppsScriptJson } from '../utils/appsScriptFetch.js'

const SESSION_KEY = 'sagideep_session_v1'

const DEV_APPS_SCRIPT_PROXY_PATH = '/__sagideep_sheet_auth'
const DEV_IP_TRACK_PROXY_PATH = '/__sagideep_sheet_ip_track'
const DEV_USERS_PROXY_PATH = '/__sagideep_users'
const DEV_PLAYLISTS_PROXY_PATH = '/__sagideep_playlists'
const DEV_MOBILE_UPDATES_PROXY_PATH = '/__sagideep_mobile_updates'
const DEV_TRACKING_PROXY_PATH = '/__sagideep_tracking'
const MSG_EMAIL_ALREADY_EXIST = 'Email already exist.'


function shouldUseAppsScriptDevProxy(remote) {
  if (!import.meta.env.DEV) return false
  if (String(import.meta.env.VITE_APPS_SCRIPT_DEV_PROXY ?? '').trim() === '0') return false
  if (!remote) return false
  try {
    return /^script\.google\.com$/i.test(new URL(remote).hostname)
  } catch {
    return false
  }
}

export function SAGIDEEP_USERS_URL() {
  const remote = String(SAGIDEEP_USERS ?? '').trim()
  if (!remote) return ''
  if (shouldUseAppsScriptDevProxy(remote) && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEV_USERS_PROXY_PATH}`
  }
  return remote
}

export function SAGIDEEP_TRACKING_URL() {
  const remote = String(SAGIDEEP_TRACKING ?? '').trim()
  if (!remote) return ''
  if (shouldUseAppsScriptDevProxy(remote) && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEV_TRACKING_PROXY_PATH}`
  }
  return remote
}


export function SAGIDEEP_PLAYLISTS_URL() {
  const remote = String(SAGIDEEP_PLAYLISTS ?? '').trim()
  if (!remote) return ''
  if (shouldUseAppsScriptDevProxy(remote) && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEV_PLAYLISTS_PROXY_PATH}`
  }
  return remote
}

export function SAGIDEEP_MOBILE_UPDATES_URL() {
  const remote = String(SAGIDEEP_MOBILE_UPDATES ?? '').trim()
  if (!remote) return ''
  if (shouldUseAppsScriptDevProxy(remote) && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEV_MOBILE_UPDATES_PROXY_PATH}`
  }
  return remote
}

/** GET playlist web app with `action=doGetVideosByPlaylistId` + `playlistId` (`e.parameter` in Apps Script). */
export function SAGIDEEP_PLAYLIST_VIDEOS(playlistId) {
  const base = SAGIDEEP_PLAYLISTS_URL()
  const id = String(playlistId ?? '').trim()
  if (!base || !id) return ''
  const action = 'doGetVideosByPlaylistId'
  try {
    const u = new URL(base)
    u.searchParams.set('action', action)
    u.searchParams.set('playlistId', id)
    return u.toString()
  } catch {
    const b = String(base).replace(/\/?$/, '')
    return `${b}?action=${encodeURIComponent(action)}&playlistId=${encodeURIComponent(id)}`
  }
}



function resolvedRemoteAuthUrl() {
  const fromEnv = String(import.meta.env.VITE_USER_AUTH_URL ?? '').trim()
  if (fromEnv) return fromEnv
  const fromConfig = String(SHEET_URL ?? '').trim()
  if (fromConfig) return fromConfig
  return String(USER_AUTH_SHEET_URL ?? '').trim()
}

/** Web app URL for footer / sheet features: `SHEET_URL` from config only (not `VITE_USER_AUTH_URL`). */
function resolvedConfigSheetWebAppUrl() {
  const fromConfig = String(SHEET_URL ?? '').trim()
  if (fromConfig) return fromConfig
  return String(USER_AUTH_SHEET_URL ?? '').trim()
}



function rawAuthUrl() {
  const remote = resolvedRemoteAuthUrl()
  if (shouldUseAppsScriptDevProxy(remote) && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEV_APPS_SCRIPT_PROXY_PATH}`
  }
  return remote
}

function rawConfigSheetUrl() {
  const remote = resolvedConfigSheetWebAppUrl()
  if (shouldUseAppsScriptDevProxy(remote) && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEV_APPS_SCRIPT_PROXY_PATH}`
  }
  return remote
}

/** Sign-up web app (`SAGIDEEP_USERS`): same-origin proxy in dev to avoid browser CORS to `script.google.com`. */
function rawSagideepUsersUrl() {
  const remote = String(SAGIDEEP_USERS ?? '').trim()
  if (!remote) return ''
  if (shouldUseAppsScriptDevProxy(remote) && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEV_USERS_PROXY_PATH}`
  }
  return remote
}



function sameWebAppPath(a, b) {
  const x = String(a ?? '').trim()
  const y = String(b ?? '').trim()
  if (!x || !y) return false
  try {
    const px = new URL(x).pathname.replace(/\/+$/i, '')
    const py = new URL(y).pathname.replace(/\/+$/i, '')
    return px === py
  } catch {
    return false
  }
}

/**
 * @param {boolean} useSheetOnly
 * @param {string} [sheetUrlOverride] — optional full `/exec` URL (e.g. IP tracking). Dev: ip-track proxy if deployment differs from `SHEET_URL`.
 */
function rawUrlForWebAppPost(useSheetOnly, sheetUrlOverride) {
  const o = String(sheetUrlOverride ?? '').trim()
  if (o) {
    const remote = o
    if (shouldUseAppsScriptDevProxy(remote) && typeof window !== 'undefined' && window.location?.origin) {
      const baseSheet = resolvedConfigSheetWebAppUrl()
      if (baseSheet && sameWebAppPath(remote, baseSheet)) {
        return `${window.location.origin}${DEV_APPS_SCRIPT_PROXY_PATH}`
      }
      return `${window.location.origin}${DEV_IP_TRACK_PROXY_PATH}`
    }
    return remote
  }
  return useSheetOnly ? rawConfigSheetUrl() : rawAuthUrl()
}

function rawAuthSecret() {
  const fromEnv = String(import.meta.env.VITE_USER_AUTH_SECRET ?? '').trim()
  if (fromEnv) return fromEnv
  return String(USER_AUTH_SECRET ?? '').trim()
}

export function getAuthWebAppUrl() {
  return rawAuthUrl()
}

/** @returns {{ ok: true, url: string } | { ok: false, reason: string }} */
export function validateAuthUrl(raw) {
  const s = String(raw ?? '').trim() || rawAuthUrl()
  if (!s) {
    return {
      ok: false,
      reason: 'Set `SHEET_URL` in `src/config/config.js` or `VITE_USER_AUTH_URL` in `.env`.',
    }
  }
  if (/docs\.google\.com\/spreadsheets/i.test(s)) {
    return {
      ok: false,
      reason: 'Use the Apps Script Web app URL (script.google.com/.../exec), not the Sheet editor link.',
    }
  }
  let parsed
  try {
    parsed = new URL(s)
  } catch {
    return { ok: false, reason: 'Auth URL is not a valid URL.' }
  }
  if (
    import.meta.env.DEV &&
    (parsed.pathname === DEV_APPS_SCRIPT_PROXY_PATH ||
      parsed.pathname === DEV_IP_TRACK_PROXY_PATH ||
      parsed.pathname === DEV_USERS_PROXY_PATH ||
      parsed.pathname.startsWith(`${DEV_APPS_SCRIPT_PROXY_PATH}/`) ||
      parsed.pathname.startsWith(`${DEV_IP_TRACK_PROXY_PATH}/`) ||
      parsed.pathname.startsWith(`${DEV_USERS_PROXY_PATH}/`)) &&
    /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)
  ) {
    return { ok: true, url: s.replace(/\/+$/, '') }
  }
  if (!/^script\.google\.com$/i.test(parsed.hostname)) {
    return { ok: false, reason: `Expected script.google.com, got "${parsed.hostname}".` }
  }
  if (!/\/exec/i.test(parsed.pathname)) {
    return { ok: false, reason: 'URL must include /exec (Web app deployment).' }
  }
  return { ok: true, url: s.replace(/\/+$/, '') }
}

/**
 * POST JSON to the Web App. Auth uses `VITE_USER_AUTH_URL` → `SHEET_URL` → fallback.
 * @param {Record<string, unknown>} body
 * @param {{ useConfigSheetUrlOnly?: boolean, sheetUrlOverride?: string }} [opts] — if `useConfigSheetUrlOnly`, POST to config sheet URL; optional **`sheetUrlOverride`** is another full `/exec` URL (e.g. IP tracking).
 * @returns {Promise<unknown>}
 */
export async function postWebAppJson(body, opts) {
  const useSheetOnly = opts?.useConfigSheetUrlOnly === true
  const sheetUrlOverride = String(opts?.sheetUrlOverride ?? '').trim()
  const validated = validateAuthUrl(rawUrlForWebAppPost(useSheetOnly, sheetUrlOverride))
  if (!validated.ok) {
    throw new Error(validated.reason)
  }
  const secret = rawAuthSecret()
  const payload = { ...(body && typeof body === 'object' ? body : {}) }
  if (secret) payload.secret = secret
  const r = await postAppsScriptJson(validated.url, payload)
  const text = await r.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(String(text || 'Invalid JSON from web app').slice(0, 160))
  }
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const j = JSON.parse(raw)
    const name = String(j?.name ?? '').trim()
    const email = String(j?.email ?? '').trim()
    if (!email) return null
    return { name: name || email, email }
  } catch {
    return null
  }
}

/** @param {{ name: string, email: string }} user */
export function setStoredSession(user) {
  const name = String(user?.name ?? '').trim()
  const email = String(user?.email ?? '').trim()
  if (!email) return
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: name || email, email }))
}

export function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

function normalizeUserFromSuccess(action, fields, data) {
  const u = data?.user
  if (u && typeof u === 'object') {
    const email = String(u.email ?? u.Email ?? u.mail ?? '').trim()
    if (email) {
      const name =
        String(u.name ?? u.displayName ?? u.fullName ?? u.username ?? '').trim() ||
        (email.includes('@') ? email.split('@')[0] : email)
      return { name: name || email, email }
    }
  }
  if (action === 'signup') {
    const email = String(fields.email || '').trim()
    const name = String(fields.name || '').trim() || email
    if (!email) return null
    return { name, email }
  }
  if (action === 'login') {
    const email = String(fields.email || '').trim()
    if (!email) return null
    const name = email.includes('@') ? email.split('@')[0] : email
    return { name, email }
  }
  return null
}

function mapLegacyError(err) {
  const human = {
    denied: 'Server rejected the request (check auth secret).',
    email_in_use: MSG_EMAIL_ALREADY_EXIST,
    invalid_credentials: 'Email or password is incorrect.',
    missing_fields: 'Please fill in all fields.',
    no_users_sheet: 'Server is missing the Users tab.',
    bad_action: 'Server misconfiguration.',
  }[String(err)]
  return human || String(err)
}

function readServerMessage(data) {
  if (!data || typeof data !== 'object') return ''
  const m =
    data.message ??
    data.Message ??
    data.msg ??
    data.errorMessage ??
    data.text ??
    data.reason
  return String(m ?? '')
    .replace(/\u200b|\ufeff/gi, '')
    .trim()
}

function isJsonSuccessTrue(data) {
  const s = data?.success
  if (s === true || s === 1) return true
  if (typeof s === 'string' && ['true', '1', 'yes'].includes(s.trim().toLowerCase())) return true
  return false
}

function isSignupDuplicateEmail(data) {
  const code = String(data?.error ?? data?.code ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
  if (
    code === 'email_in_use' ||
    code === 'email_exists' ||
    code === 'duplicate_email' ||
    code === 'user_exists' ||
    code === 'already_exists'
  ) {
    return true
  }
  const rawMsg = readServerMessage(data)
  const msg = rawMsg.toLowerCase()
  if (!msg) return false
  if (/email\s+already\s+exists?/.test(msg)) return true
  if (/^(success!?|ok|done|complete)$/i.test(rawMsg)) return true
  return (
    /already\s*(exists|registered|in\s*use|taken)/.test(msg) ||
    /email\s*(already|is\s*already|has\s*already|exists)/.test(msg) ||
    /duplicate\s*(email|user|account)/.test(msg) ||
    /(exists|registered).{0,40}\bemail\b/.test(msg) ||
    /\bemail\b.{0,40}(exists|registered|taken|in\s*use)/.test(msg)
  )
}

function isDuplicateEmailCase(action, data) {
  if (action !== 'signup') return false
  return isSignupDuplicateEmail(data)
}

function messageForJsonFailure(action, data) {
  if (isDuplicateEmailCase(action, data)) return MSG_EMAIL_ALREADY_EXIST
  const m = readServerMessage(data)
  if (m) return m
  return action === 'login' ? 'Could not log in.' : 'Could not sign up.'
}

async function postAuth(action, fields) {
  const validated = validateAuthUrl(rawAuthUrl())
  if (!validated.ok) {
    return { ok: false, error: 'config', message: validated.reason }
  }
  const url = validated.url
  const secret = rawAuthSecret()
  const body = { action, ...fields }
  if (secret) body.secret = secret

  let r
  try {
    r = await postAppsScriptJson(url, body)
  } catch (e) {
    return { ok: false, error: 'network', message: String(e?.message || 'Network error') }
  }

  let data
  try {
    data = JSON.parse(await r.text())
  } catch {
    return { ok: false, error: 'bad_response', message: 'Invalid server response' }
  }

  if (data && typeof data.success !== 'undefined') {
    if (isJsonSuccessTrue(data)) {
      let user = normalizeUserFromSuccess(action, fields, data)
      if (!user?.email && action === 'login') {
        const email = String(fields.email || '').trim()
        if (email) {
          user = { name: email.includes('@') ? email.split('@')[0] : email, email }
        }
      }
      if (!user?.email) {
        return { ok: false, error: 'bad_response', message: 'Server did not return account details.' }
      }
      return { ok: true, user: { name: user.name || user.email, email: user.email } }
    }
    return {
      ok: false,
      error: isDuplicateEmailCase(action, data) ? 'email_in_use' : 'server',
      message: messageForJsonFailure(action, data),
    }
  }

  if (data && data.ok === true && data.user && data.user.email) {
    return {
      ok: true,
      user: {
        name: String(data.user.name || '').trim(),
        email: String(data.user.email).trim(),
      },
    }
  }
  if (data && data.ok === false && readServerMessage(data)) {
    return {
      ok: false,
      error: isDuplicateEmailCase(action, data) ? 'email_in_use' : String(data?.error || 'server'),
      message: messageForJsonFailure(action, data),
    }
  }

  const err = String(data?.error || 'unknown')
  return { ok: false, error: err, message: mapLegacyError(err) }
}

/** Best-effort public IP for sheet column "User IP Address" (signup only). */
export async function fetchPublicIp() {
  try {
    const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
    if (!r.ok) return ''
    const j = await r.json()
    return String(j?.ip ?? '').trim()
  } catch {
    return ''
  }
}

function shouldTreatSignupAsEmailDuplicate(res) {
  if (res.ok) return false
  const m = String(res.message ?? '').trim().toLowerCase()
  if (res.error === 'email_in_use') return true
  if (/^(success!?|ok|done|complete)$/.test(m)) return true
  return (
    /email\s+already|already\s+exist|already\s+registered|duplicate\s+email|email\s+(is\s+)?(in\s+use|taken)/.test(
      m,
    )
  )
}

function finalizeSignupResponse(res) {
  if (!shouldTreatSignupAsEmailDuplicate(res)) return res
  return { ...res, message: MSG_EMAIL_ALREADY_EXIST, error: 'email_in_use' }
}

/**
 * @param {{ name: string, email: string, password: string, ip?: string }} opts
 * `ip` is optional; if omitted, a public IP is requested before signup.
 */
export async function signup(opts) {
  const name = String(opts?.name ?? '').trim()
  const email = String(opts?.email ?? '').trim().toLowerCase()
  const password = String(opts?.password ?? '')
  let ip = String(opts?.ip ?? '').trim()
  if (!ip) ip = await fetchPublicIp()
  const res = await postAuth('signup', { name, email, password, ip })
  return finalizeSignupResponse(res)
}

/**
 * @param {{ email: string, password: string }} opts
 */
export async function login(opts) {
  const email = String(opts?.email ?? '').trim().toLowerCase()
  const password = String(opts?.password ?? '')
  return postAuth('login', { email, password })
}

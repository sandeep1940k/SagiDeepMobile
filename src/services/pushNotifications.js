import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { FCM } from '@capacitor-community/fcm'
import { PushNotifications } from '@capacitor/push-notifications'
import { ref } from 'vue'
import { SAGIDEEP_TRACKING_URL } from './userAuth.js'
import { fetchPublicIp } from './sheetClickIpTrack.js'
import { postAppsScriptJson } from '../utils/appsScriptFetch.js'

/** Must match AndroidManifest meta-data and createChannel id. */
export const PUSH_CHANNEL_ID = 'sagideep_push'

/**
 * All devices subscribe on app start — Firebase campaigns / firebase-admin send to this topic.
 * Firebase Console → Messaging → Target → Topic → `allUsers`
 */
export const BROADCAST_TOPIC = 'allUsers'

/** Extra topics for later (subscribe manually when you add those features). */
export const PUSH_TOPICS = {
  allUsers: 'allUsers',
  newEpisodes: 'newEpisodes',
  appUpdates: 'appUpdates',
  movies: 'movies',
  anime: 'anime',
  premium: 'premium',
}

const TOKEN_STORAGE_KEY = 'sagideep_fcm_token_v1'
const TOPIC_OK_KEY = 'sagideep_topic_ok_v1'

export const pushDebugState = ref({
  status: 'idle',
  permission: '',
  token: '',
  topic: '',
  topicOk: false,
  error: '',
  hint: '',
  lastEvent: '',
})

let listenersAttached = false
let appResumeHooked = false

function setState(patch) {
  pushDebugState.value = { ...pushDebugState.value, ...patch }
}

function persistToken(token) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    /* ignore */
  }
}

function loadStoredToken() {
  try {
    return String(localStorage.getItem(TOKEN_STORAGE_KEY) || '').trim()
  } catch {
    return ''
  }
}

function markTopicOk(ok) {
  try {
    localStorage.setItem(TOPIC_OK_KEY, ok ? '1' : '0')
  } catch {
    /* ignore */
  }
  setState({ topicOk: ok, topic: ok ? BROADCAST_TOPIC : '' })
}

function loadTopicOk() {
  try {
    return localStorage.getItem(TOPIC_OK_KEY) === '1'
  } catch {
    return false
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function resolveFcmToken() {
  const fromListener = loadStoredToken()
  if (fromListener) return fromListener
  try {
    const { token } = await FCM.getToken()
    const t = String(token ?? '').trim()
    if (t) persistToken(t)
    return t
  } catch {
    return ''
  }
}

/** Retry topic subscribe — FCM needs a valid token first. */
async function subscribeToBroadcastTopic() {
  if (!Capacitor.isNativePlatform()) return false

  for (let attempt = 1; attempt <= 6; attempt++) {
    const token = await resolveFcmToken()
    if (!token) {
      await delay(800 * attempt)
      continue
    }
    setState({ token, status: 'registered' })

    try {
      await FCM.subscribeTo({ topic: BROADCAST_TOPIC })
      markTopicOk(true)
      setState({
        hint:
          'Subscribed to allUsers. Firebase: Topic "allUsers" or Android app — Schedule Now.',
        lastEvent: `topic ok (try ${attempt}) ${new Date().toLocaleTimeString()}`,
      })
      console.log('[FCM] subscribed to topic:', BROADCAST_TOPIC)
      void reportFcmTokenToSheet(token)
      return true
    } catch (e) {
      console.warn(`[FCM] topic subscribe attempt ${attempt}:`, e)
      await delay(1000 * attempt)
    }
  }

  markTopicOk(false)
  setState({
    hint: 'Topic subscribe failed — tap Retry. You can still send to Android app in Firebase (all tokens).',
  })
  return false
}

async function reportFcmTokenToSheet(token) {
  const url = SAGIDEEP_TRACKING_URL()
  if (!url || !token) return
  try {
    const ip = await fetchPublicIp()
    await postAppsScriptJson(url, {
      ipAddress: ip,
      activity: 'fcm_register',
      fcmToken: token,
      topic: BROADCAST_TOPIC,
    })
  } catch (e) {
    console.warn('[FCM] sheet register:', e)
  }
}

function attachListeners() {
  if (listenersAttached) return
  listenersAttached = true

  PushNotifications.addListener('registration', (token) => {
    const value = String(token?.value ?? '').trim()
    persistToken(value)
    setState({
      status: 'registered',
      token: value,
      error: '',
      lastEvent: `registered ${new Date().toLocaleTimeString()}`,
    })
    console.log('[FCM] device token:', value)
    void subscribeToBroadcastTopic()
  })

  PushNotifications.addListener('registrationError', (err) => {
    const msg = String(err?.error ?? err?.message ?? JSON.stringify(err) ?? 'registration failed')
    setState({
      status: 'error',
      error: msg,
      hint: 'Rebuild with npm run apk, reinstall, allow notifications.',
      lastEvent: `registrationError ${new Date().toLocaleTimeString()}`,
    })
    console.error('[FCM] registration error:', err)
  })

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    const title = String(notification?.title ?? notification?.data?.title ?? 'notification')
    setState({
      lastEvent: `received "${title}" ${new Date().toLocaleTimeString()}`,
    })
    console.log('[FCM] notification received:', notification)
  })

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    setState({ lastEvent: `opened ${new Date().toLocaleTimeString()}` })
    console.log('[FCM] notification action:', action)
  })
}

function hookAppResume() {
  if (appResumeHooked || !Capacitor.isNativePlatform()) return
  appResumeHooked = true
  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void registerForPush()
  })
}

async function ensureAndroidChannel() {
  if (Capacitor.getPlatform() !== 'android') return
  try {
    await PushNotifications.createChannel({
      id: PUSH_CHANNEL_ID,
      name: 'SagiDeep',
      description: 'App updates and alerts',
      importance: 5,
      visibility: 1,
      vibration: true,
    })
  } catch (e) {
    console.warn('[FCM] createChannel:', e)
  }
}

/** Register FCM + subscribe every user to broadcast topic (call on launch & resume). */
export async function registerForPush() {
  if (!Capacitor.isNativePlatform()) {
    setState({
      status: 'web_skipped',
      hint: 'Push only works in the installed APK, not the browser.',
    })
    return
  }

  hookAppResume()
  attachListeners()

  const stored = loadStoredToken()
  const topicWasOk = loadTopicOk()
  if (stored) {
    setState({
      token: stored,
      status: 'registered',
      topic: topicWasOk ? BROADCAST_TOPIC : '',
      topicOk: topicWasOk,
    })
  }

  setState({ status: 'initializing', error: '', hint: 'Requesting permission…' })
  await ensureAndroidChannel()

  const perm = await PushNotifications.requestPermissions()
  const receive = String(perm?.receive ?? '')
  setState({ permission: receive })

  if (receive !== 'granted') {
    setState({
      status: 'permission_denied',
      hint: 'Settings → Apps → SagiDeep → Notifications → Allow.',
    })
    return
  }

  setState({ hint: 'Registering with Firebase…' })
  try {
    await PushNotifications.register()
    await delay(500)
    await subscribeToBroadcastTopic()
  } catch (e) {
    setState({
      status: 'error',
      error: String(e?.message ?? e),
      hint: 'Run npm run apk and reinstall the app.',
    })
  }
}

export async function initPushNotifications() {
  await registerForPush()
}

export function getFcmToken() {
  return String(pushDebugState.value.token || loadStoredToken()).trim()
}

/** Subscribe one device to an extra topic (e.g. anime, movies). */
export async function subscribeToTopic(topic) {
  const name = String(topic ?? '').trim()
  if (!name || !Capacitor.isNativePlatform()) return false
  try {
    await FCM.subscribeTo({ topic: name })
    console.log('[FCM] subscribed to topic:', name)
    return true
  } catch (e) {
    console.warn('[FCM] subscribeToTopic:', e)
    return false
  }
}

export async function unsubscribeFromTopic(topic) {
  const name = String(topic ?? '').trim()
  if (!name || !Capacitor.isNativePlatform()) return false
  try {
    await FCM.unsubscribeFrom({ topic: name })
    return true
  } catch (e) {
    console.warn('[FCM] unsubscribeFromTopic:', e)
    return false
  }
}

export async function copyFcmTokenToClipboard() {
  const token = getFcmToken()
  if (!token) return false
  try {
    await navigator.clipboard.writeText(token)
    setState({ hint: 'Token copied (one device only).' })
    return true
  } catch {
    setState({ hint: 'Copy failed — select token text manually.' })
    return false
  }
}

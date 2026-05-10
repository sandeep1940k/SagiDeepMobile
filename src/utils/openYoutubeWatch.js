import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { YouTubeLaunch } from '../plugins/YouTubeLaunch.js'

/** @param {string} videoId */
export function youtubeWatchHttpsUrl(videoId) {
  const id = String(videoId || '').trim()
  if (!id) return ''
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
}

/**
 * Android intent URL (fallback if native plugin fails). Only use inside the real Android app —
 * never in desktop/mobile Chrome: DevTools device emulation spoofs Android UA but has no intent handler.
 */
function androidYoutubeIntent(videoId, httpsWatchUrl) {
  const encId = encodeURIComponent(videoId)
  const fallback = encodeURIComponent(httpsWatchUrl)
  return `intent://www.youtube.com/watch?v=${encId}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${fallback};end`
}

function iosYoutubeAppUrl(videoId) {
  const encId = encodeURIComponent(videoId)
  return `youtube://www.youtube.com/watch?v=${encId}`
}

function dispatchUrl(url) {
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('rel', 'noopener noreferrer')
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * - Web / Vite / Chrome (including device emulation): always https in a new tab — no intent://
 * - Native Android: native Intent via plugin, then intent://, then in-app browser
 * - Native iOS: youtube:// then in-app browser
 * @param {string | undefined} videoId
 */
export async function openYoutubeWatchPreferApp(videoId) {
  const id = String(videoId || '').trim()
  if (!id) return

  const https = youtubeWatchHttpsUrl(id)

  if (!Capacitor.isNativePlatform()) {
    window.open(https, '_blank', 'noopener,noreferrer')
    return
  }

  const platform = Capacitor.getPlatform()

  if (platform === 'android') {
    try {
      await YouTubeLaunch.openWatch({ videoId: id })
      return
    } catch {
      /* fall through */
    }
    try {
      dispatchUrl(androidYoutubeIntent(id, https))
      return
    } catch {
      /* fall through */
    }
    try {
      await Browser.open({ url: https })
    } catch {
      window.open(https, '_blank', 'noopener,noreferrer')
    }
    return
  }

  if (platform === 'ios') {
    try {
      dispatchUrl(iosYoutubeAppUrl(id))
      return
    } catch {
      /* fall through */
    }
    try {
      await Browser.open({ url: https })
    } catch {
      window.open(https, '_blank', 'noopener,noreferrer')
    }
    return
  }

  window.open(https, '_blank', 'noopener,noreferrer')
}

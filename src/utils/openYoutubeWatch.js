import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

/** @param {string} videoId */
export function youtubeWatchHttpsUrl(videoId) {
  const id = String(videoId || '').trim()
  if (!id) return ''
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
}

/**
 * Android: intent targets the YouTube app; S.browser_fallback_url opens the watch page if the app is missing.
 * iOS: youtube:// prefers the installed YouTube app; falls back to in-app browser.
 */
function androidYoutubeIntent(videoId, httpsWatchUrl) {
  const id = encodeURIComponent(videoId)
  const fallback = encodeURIComponent(httpsWatchUrl)
  return `intent://www.youtube.com/watch?v=${id}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${fallback};end`
}

function iosYoutubeAppUrl(videoId) {
  const id = encodeURIComponent(videoId)
  return `youtube://www.youtube.com/watch?v=${id}`
}

/** Open a URL via a real click so the WebView can hand off to the OS (intents / URL schemes) without replacing the app. */
function dispatchUrl(url) {
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('rel', 'noopener noreferrer')
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Open this video in the mobile YouTube app when possible (native Android/iOS).
 * Falls back to Capacitor in-app browser, then window.open.
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

  try {
    if (platform === 'android') {
      dispatchUrl(androidYoutubeIntent(id, https))
      return
    }
    if (platform === 'ios') {
      dispatchUrl(iosYoutubeAppUrl(id))
      return
    }
  } catch {
    /* fall through */
  }

  try {
    await Browser.open({ url: https })
  } catch {
    window.open(https, '_blank', 'noopener,noreferrer')
  }
}

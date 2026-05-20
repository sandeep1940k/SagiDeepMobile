import { reactive } from 'vue'
import { pickMobileUpdatesSubscriberRaw } from '../utils/mobileUpdatesPayload.js'
import { SAGIDEEP_MOBILE_UPDATES_URL } from '../services/userAuth.js'
import { postAppsScriptJson } from '../utils/appsScriptFetch.js'

/**
 * Subscriber line from **`SAGIDEEP_MOBILE_UPDATES`** (set after fetch).
 * Used by `GlobalFooter`, `YoutubeChannelPromo`, and `VideoPlayerView` so counts match app-wide.
 */
export const mobileUpdatesChannelSync = reactive({
  subscriberCell: '',
})

export function syncMobileUpdatesChannelFromPayload(raw) {
  mobileUpdatesChannelSync.subscriberCell = pickMobileUpdatesSubscriberRaw(raw)
}

export function clearMobileUpdatesChannelFromPayload() {
  mobileUpdatesChannelSync.subscriberCell = ''
}

/** POST mobile-updates web app and refresh `subscriberCell` (e.g. watch route has no `GlobalFooter`). */
export async function fetchAndSyncMobileUpdatesChannelStats() {
  const url = SAGIDEEP_MOBILE_UPDATES_URL()
  if (!url) {
    clearMobileUpdatesChannelFromPayload()
    return
  }
  try {
    const res = await postAppsScriptJson(url, { action: 'footerMobileUpdate' })
    const data = await res.json()
    syncMobileUpdatesChannelFromPayload(data)
  } catch {
    clearMobileUpdatesChannelFromPayload()
  }
}

import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob'
import { getActiveBannerAdUnitId, isAdmobTestMode } from '../config/admob.js'

let initialized = false
let bannerShown = false

export async function initAdMob() {
  if (!Capacitor.isNativePlatform()) return
  if (initialized) return
  try {
    await AdMob.initialize({
      initializeForTesting: isAdmobTestMode(),
    })
    initialized = true
  } catch (e) {
    console.warn('[AdMob] initialize failed:', e)
  }
}

/** Routes where the native banner overlay is hidden (full-screen / auth). */
export function shouldShowBannerOnRoute(routeName) {
  return routeName !== 'watch' && routeName !== 'auth'
}

export async function showAdBanner() {
  if (!Capacitor.isNativePlatform() || !initialized) return
  if (bannerShown) return
  try {
    await AdMob.showBanner({
      adId: getActiveBannerAdUnitId(),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 56,
      isTesting: isAdmobTestMode(),
    })
    bannerShown = true
  } catch (e) {
    console.warn('[AdMob] showBanner failed:', e)
  }
}

export async function hideAdBanner() {
  if (!Capacitor.isNativePlatform() || !bannerShown) return
  try {
    await AdMob.hideBanner()
  } catch {
    try {
      await AdMob.removeBanner()
    } catch {
      /* ignore */
    }
  }
  bannerShown = false
}

export async function syncAdBannerForRoute(routeName) {
  if (!Capacitor.isNativePlatform()) return
  if (!initialized) await initAdMob()
  if (shouldShowBannerOnRoute(routeName)) await showAdBanner()
  else await hideAdBanner()
}

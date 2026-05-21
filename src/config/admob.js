/** AdMob App ID (`~`) — AndroidManifest APPLICATION_ID */
export const ADMOB_APP_ID = 'ca-app-pub-8378787155343087~2508714038'

/** Your banner ad unit (`/`) — production */
export const ADMOB_BANNER_UNIT_ID = 'ca-app-pub-8378787155343087/6825713086'

/** Google official test banner (same idea as React Native `TestIds.BANNER`) */
export const ADMOB_TEST_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111'

const viteEnv = typeof import.meta !== 'undefined' && import.meta.env != null ? import.meta.env : {}

/**
 * Test ads: `npm run dev`, or `VITE_ADMOB_TESTING=1`.
 * Live ads: `npm run build` / `npm run apk`, or `VITE_ADMOB_PRODUCTION=1`.
 */
export function isAdmobTestMode() {
  if (viteEnv.VITE_ADMOB_PRODUCTION === '1') return false
  if (viteEnv.VITE_ADMOB_TESTING === '1') return true
  if (viteEnv.VITE_ADMOB_TESTING === '0') return false
  if (viteEnv.DEV) return true
  return false
}

/** Banner unit passed to `AdMob.showBanner`. */
export function getActiveBannerAdUnitId() {
  return isAdmobTestMode() ? ADMOB_TEST_BANNER_UNIT_ID : ADMOB_BANNER_UNIT_ID
}

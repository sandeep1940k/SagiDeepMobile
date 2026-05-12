/**
 * Google Apps Script Web App URL (must end with /exec).
 * Override with VITE_PLAYLIST_LOG_URL in `.env` if needed.
 */
export const PLAYLIST_SHEET_LOG_URL =
  'https://script.google.com/macros/s/AKfycbwwM06E1t7Bj8Yu_9rnPkltFcyiWihQfDKDue1FHe5VBHNrpN6f1lwSbYuLRYDtkjORJg/exec'

/** Optional: must match Apps Script script property LOG_SECRET if you use it. */
export const PLAYLIST_SHEET_LOG_SECRET = ''

/**
 * Extra form fields on every playlist tap (e.parameter in Apps Script).
 */
export const PLAYLIST_LOG_CUSTOM_FIELDS = {
  // app: 'SagiDeep',
}

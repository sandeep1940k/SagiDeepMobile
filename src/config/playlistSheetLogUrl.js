/**
 * Google Apps Script Web App URL (must end with /exec).
 * Override with VITE_PLAYLIST_LOG_URL in `.env` if needed.
 */
export const PLAYLIST_SHEET_LOG_URL =
  'https://script.google.com/macros/s/AKfycbwNJrxNC6QAZve_UPHrXRA6povuDt70mtnbCSSxHP8ISWicxUyy86J2V5TritcAvWby1w/exec'

/** Optional: must match Apps Script script property LOG_SECRET if you use it. */
export const PLAYLIST_SHEET_LOG_SECRET = ''

/**
 * Extra form fields on every playlist tap (e.parameter in Apps Script).
 */
export const PLAYLIST_LOG_CUSTOM_FIELDS = {
  // app: 'SagiDeep',
}


export const SAGIDEEP_USERS = 'https://script.google.com/macros/s/AKfycbz48GWhmV7_nSVeBTxZHVe1iB5rxx0eq4W_MoHXoWqav3TElmd06sc3xzKuzsUzj_4v/exec';
export const SAGIDEEP_PLAYLISTS = 'https://script.google.com/macros/s/AKfycbw9qopI0bxxsD-CcOgnMLAz6DShhFSYi17lTFwq3fnC9R3JYLpJjktWvhGvsTVPluuf1Q/exec';
export const SAGIDEEP_MOBILE_UPDATES = 'https://script.google.com/macros/s/AKfycbz6_PhmR01JaHr08yUgNSjAZQ3D_9Q3ZVwuGjNnLsHVRsR8JZXmXoW3WJxGE--bEPdG/exec';
export const SAGIDEEP_TRACKING = 'https://script.google.com/macros/s/AKfycbxM6R2_XptGiH5yjbz1_tzqgfCM_puVUdKMr7V2popvAt_rsCPXOGS5Uc14wzlsXgN7/exec';













/** Google Apps Script Web App URL (login, signup, and footer promo all use this). */
export const SHEET_URL =
  'https://script.google.com/macros/s/AKfycbxcwho1ID8uhkWrVrYVm4X0YKDrdL5bLgkiNv0va1VON4xGG2MMJ8WJGh_0TH-3Jo6A/exec'

/** Safe when `vite.config.js` imports this file (Node may not define `import.meta.env`). */
const viteEnv = typeof import.meta !== 'undefined' && import.meta.env != null ? import.meta.env : {}

/**
 * Footer “mobile update” promo: POST to **`SHEET_URL` only** (not `VITE_USER_AUTH_URL` — see `postWebAppJson(..., { useConfigSheetUrlOnly: true })`).
 * Script should return JSON: **`mobileUpdateVideoLink`**, **`isMobileUpdate`**, **`subscribes`** (sheet cols I, J, K).
 * `VITE_FOOTER_PROMO_SHEET_ENABLED=0` → skip fetch (static `youtubeChannel` only).
 */
export const FOOTER_PROMO_SHEET_ENABLED = viteEnv.VITE_FOOTER_PROMO_SHEET_ENABLED !== '0'

/** Web app `action` for footer mobile update (override with `VITE_FOOTER_PROMO_ACTION`). */
export const FOOTER_PROMO_APPS_SCRIPT_ACTION =
  String(viteEnv.VITE_FOOTER_PROMO_ACTION ?? 'footerMobileUpdate').trim() || 'footerMobileUpdate'

const envFooterCsv = viteEnv.VITE_FOOTER_PROMO_SHEET_CSV_URL
/** If set, load footer promo from this CSV (rows use sheet cols I, J, K — see `footerPromoSheet.js`). */
export const FOOTER_PROMO_SHEET_CSV_URL =
  typeof envFooterCsv === 'string' && envFooterCsv.trim() !== '' ? envFooterCsv.trim() : ''

/** POST JSON `{ action, ip }` to the web app (same body style as signup/login). */
export const SHEET_IP_TRACK_ENABLED = viteEnv.VITE_SHEET_IP_TRACK_ENABLED !== '0'

/** JSON `action` (default `trackIP`). */
export const SHEET_IP_TRACK_ACTION =
  String(viteEnv.VITE_SHEET_IP_TRACK_ACTION ?? 'trackIP').trim() || 'trackIP'

const envIpTrackUrl = viteEnv.VITE_SHEET_IP_TRACK_URL
/** If empty, IP tracking POSTs use **`SHEET_URL`** (same deployment as your HTML `SCRIPT_URL`). */
export const SHEET_IP_TRACK_URL =
  typeof envIpTrackUrl === 'string' && envIpTrackUrl.trim() !== '' ? envIpTrackUrl.trim() : ''

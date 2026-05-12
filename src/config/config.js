/** Google Apps Script Web App URL (login, signup, and footer promo all use this). */
export const SHEET_URL =
  'https://script.google.com/macros/s/AKfycbwMIC7qdVAQEmjFMA_r_p0s06quUd5FDt2jx3A-hFvTifKXzsU4zTUeRRekldv3T1Xl/exec'

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

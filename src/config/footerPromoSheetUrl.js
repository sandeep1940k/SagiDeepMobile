/**
 * Public Google Sheet tab **Mobile Update** (CSV via `gviz/tq?tqx=out:csv`, same as playlists): column A = video URL, column B = isUpdate (TRUE to show footer promo). Columns may be swapped (URL in B, checkbox in A).
 * Override URL with `VITE_FOOTER_PROMO_SHEET_CSV_URL` in `.env`.
 * Set `VITE_FOOTER_PROMO_SHEET_ENABLED=0` to skip the sheet (footer uses static `youtubeChannel` only).
 * When the sheet is on, the footer shows if **any** row has `isUpdate` TRUE and a valid YouTube URL in the paired column (see `footerPromoSheet.js`).
 */
export const FOOTER_PROMO_SHEET_ENABLED = import.meta.env.VITE_FOOTER_PROMO_SHEET_ENABLED !== '0'

const DEFAULT_SHEET_ID = '147Ds6y1uAU-Dgk-IUth7TaBdpj_bWZqMLFf_MFJNpaQ'
const DEFAULT_SHEET_TAB = 'Mobile Update'

const envUrl = import.meta.env.VITE_FOOTER_PROMO_SHEET_CSV_URL
export const FOOTER_PROMO_SHEET_CSV_URL =
  typeof envUrl === 'string' && envUrl.trim() !== ''
    ? envUrl.trim()
    : `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(DEFAULT_SHEET_TAB)}`

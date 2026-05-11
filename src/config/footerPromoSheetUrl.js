/**
 * Public Google Sheet tab **Mobile Update** (CSV): column A = video URL, column B = isUpdate (TRUE to show footer promo).
 * Override URL with `VITE_FOOTER_PROMO_SHEET_CSV_URL` in `.env`.
 * Set `VITE_FOOTER_PROMO_SHEET_ENABLED=0` to skip the sheet and use static `youtubeChannel` footer fields only.
 */
export const FOOTER_PROMO_SHEET_ENABLED = import.meta.env.VITE_FOOTER_PROMO_SHEET_ENABLED !== '0'

const DEFAULT_SHEET_ID = '147Ds6y1uAU-Dgk-IUth7TaBdpj_bWZqMLFf_MFJNpaQ'
const DEFAULT_SHEET_TAB = 'Mobile Update'

const envUrl = import.meta.env.VITE_FOOTER_PROMO_SHEET_CSV_URL
export const FOOTER_PROMO_SHEET_CSV_URL =
  typeof envUrl === 'string' && envUrl.trim() !== ''
    ? envUrl.trim()
    : `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(DEFAULT_SHEET_TAB)}`

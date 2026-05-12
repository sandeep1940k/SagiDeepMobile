import { reactive } from 'vue'
import {
  FOOTER_PROMO_APPS_SCRIPT_ACTION,
  FOOTER_PROMO_SHEET_CSV_URL,
  FOOTER_PROMO_SHEET_ENABLED,
} from '../config/config.js'
import { postWebAppJson } from '../services/userAuth.js'
import { parseCSV } from './playlists.js'
import { extractYoutubeVideoId } from '../utils/youtubeVideoId.js'

/** Sheet columns I, J, K (1-based): YouTube URL, isUpdate (TRUE/…), subscribers. */
const CSV_COL_I = 8
const CSV_COL_J = 9
const CSV_COL_K = 10

/** Runtime footer promo: same Apps Script as **`SHEET_URL`** in `config.js` (or optional CSV). */
export const footerPromoSheet = reactive({
  ready: false,
  active: false,
  videoUrl: '',
  videoId: '',
  title: '',
  description: '',
  /** Column K — subscriber line for `YoutubeChannelPromo` on home. */
  subscribersLine: '',
})

function parseIsUpdate(cell) {
  if (cell === true || cell === 1) return true
  const t = String(cell ?? '')
    .trim()
    .toUpperCase()
  return t === 'TRUE' || t === '1' || t === 'YES' || t === 'Y'
}

/**
 * One CSV row → values from columns **I, J, K** only.
 * - Full tab export (A…): uses 0-based indices 8, 9, 10 (requires `row.length >= 11`).
 * - Narrow export (range **I:K** only): exactly 3 cells per row = I, J, K in order.
 * @param {string[]} row
 * @returns {{ colI: string, colJ: string, colK: string } | null}
 */
function ijkFromCsvRow(row) {
  if (!Array.isArray(row)) return null
  if (row.length >= 11) {
    return {
      colI: String(row[CSV_COL_I] ?? '').trim(),
      colJ: String(row[CSV_COL_J] ?? '').trim(),
      colK: String(row[CSV_COL_K] ?? '').trim(),
    }
  }
  if (row.length === 3) {
    return {
      colI: String(row[0] ?? '').trim(),
      colJ: String(row[1] ?? '').trim(),
      colK: String(row[2] ?? '').trim(),
    }
  }
  return null
}

/**
 * @param {string[]} row
 * @returns {{ videoLink: string, videoId: string, subscribersLine: string } | null}
 */
function pickPromoFromRow(row) {
  const ijk = ijkFromCsvRow(row)
  if (!ijk) return null
  const { colI, colJ, colK } = ijk
  if (!parseIsUpdate(colJ)) return null
  const id = extractYoutubeVideoId(colI)
  if (!id) return null
  return {
    videoLink: colI || `https://www.youtube.com/watch?v=${id}`,
    videoId: id,
    subscribersLine: colK,
  }
}

function findPromoRow(rows) {
  for (const row of rows) {
    const picked = pickPromoFromRow(row)
    if (picked) return picked
  }
  return null
}

/** Prefer column **K** on a row where **I** is a YouTube URL and **J** is TRUE; else last **K** with a digit. */
function findSubscribersLineForCard(rows) {
  let lastKWithDigit = ''
  for (const row of rows) {
    const ijk = ijkFromCsvRow(row)
    if (!ijk) continue
    const { colI, colJ, colK } = ijk
    if (extractYoutubeVideoId(colI) && parseIsUpdate(colJ)) return colK
    if (colK && /\d/.test(colK)) lastKWithDigit = colK
  }
  return lastKWithDigit
}

/** Web app JSON: `mobileUpdateVideoLink`, `isMobileUpdate`, `subscribes` (or `subscribers`). */
function pickPromoFromWebAppJson(raw) {
  if (!raw || typeof raw !== 'object') return null
  const data = raw.data && typeof raw.data === 'object' ? raw.data : raw
  const link = String(data.mobileUpdateVideoLink ?? '').trim()
  const subs = String(data.subscribes ?? data.subscribers ?? '').trim()
  const id =
    extractYoutubeVideoId(String(data.youtubeVideoId ?? '').trim()) || extractYoutubeVideoId(link)
  if (!link || !parseIsUpdate(data.isMobileUpdate) || !id) return null
  return {
    videoLink: link || `https://www.youtube.com/watch?v=${id}`,
    videoId: id,
    subscribersLine: subs,
  }
}

async function fetchOEmbedTitle(watchUrl) {
  try {
    const u = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
    const res = await fetch(u)
    if (!res.ok) return ''
    const j = await res.json()
    return String(j.title || '').trim()
  } catch {
    return ''
  }
}

function normalizeYoutubeWatchUrl(rawLink, videoId) {
  const s = String(rawLink || '').trim()
  if (!s) return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
  try {
    return new URL(s.startsWith('http') ? s : `https://${s}`).href
  } catch {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
  }
}

async function applyPickedPromo(picked) {
  if (!picked) return
  footerPromoSheet.subscribersLine = String(picked.subscribersLine || '').trim()
  const { videoLink, videoId } = picked
  const videoUrl = normalizeYoutubeWatchUrl(videoLink, videoId)
  const title = (await fetchOEmbedTitle(videoUrl)) || 'Watch on YouTube'
  footerPromoSheet.videoUrl = videoUrl
  footerPromoSheet.videoId = videoId
  footerPromoSheet.title = title
  footerPromoSheet.description = ''
  footerPromoSheet.active = true
}

/**
 * Loads footer promo: POST `{ action: "footerMobileUpdate" }` to **`SHEET_URL`**, then use **`data.mobileUpdateVideoLink`**, **`data.isMobileUpdate`**, **`data.subscribes`** (same shape as your `fetch` → `res.json()`).
 * Optional CSV: still **I, J, K** columns per row.
 */
export async function loadFooterPromoFromSheet() {
  footerPromoSheet.ready = false
  footerPromoSheet.active = false
  footerPromoSheet.videoUrl = ''
  footerPromoSheet.videoId = ''
  footerPromoSheet.title = ''
  footerPromoSheet.description = ''
  footerPromoSheet.subscribersLine = ''

  if (!FOOTER_PROMO_SHEET_ENABLED) {
    footerPromoSheet.ready = true
    return
  }

  try {
    if (FOOTER_PROMO_SHEET_CSV_URL) {
      const res = await fetch(FOOTER_PROMO_SHEET_CSV_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const csvText = (await res.text()).replace(/^\uFEFF/, '')
      const rows = parseCSV(csvText)
      if (rows.length === 0) {
        footerPromoSheet.ready = true
        return
      }
      const rowSubscribers = findSubscribersLineForCard(rows)
      const picked = findPromoRow(rows)
      if (picked) {
        footerPromoSheet.subscribersLine = String(
          (picked.subscribersLine || '').trim() || rowSubscribers,
        ).trim()
        await applyPickedPromo(picked)
      } else {
        footerPromoSheet.subscribersLine = String(rowSubscribers || '').trim()
      }
    } else {
      const data = await postWebAppJson(
        { action: FOOTER_PROMO_APPS_SCRIPT_ACTION },
        { useConfigSheetUrlOnly: true },
      )
      await applyPickedPromo(pickPromoFromWebAppJson(data))
    }
  } catch (e) {
    console.warn('[footerPromo] load failed', e)
    footerPromoSheet.active = false
  } finally {
    footerPromoSheet.ready = true
  }
}

/*
if (action === 'footerMobileUpdate') {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  var row = sh.getRange(2, 9, 2, 11).getValues()[0];
  return ContentService.createTextOutput(JSON.stringify({
    mobileUpdateVideoLink: row[0],
    isMobileUpdate: row[1],
    subscribes: row[2]
  })).setMimeType(ContentService.MimeType.JSON);
}
*/

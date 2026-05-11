import { reactive } from 'vue'
import { FOOTER_PROMO_SHEET_CSV_URL, FOOTER_PROMO_SHEET_ENABLED } from '../config/footerPromoSheetUrl.js'
import { parseCSV } from './playlists.js'
import { extractYoutubeVideoId } from '../utils/youtubeVideoId.js'

/** Runtime footer promo when driven by Google Sheet tab “Mobile Update”. */
export const footerPromoSheet = reactive({
  /** Fetch finished (success or failure). */
  ready: false,
  /** Sheet row says show promo and video id parsed. */
  active: false,
  videoUrl: '',
  videoId: '',
  title: '',
  description: '',
})

function parseIsUpdate(cell) {
  const t = String(cell ?? '')
    .trim()
    .toUpperCase()
  return t === 'TRUE' || t === '1' || t === 'YES' || t === 'Y'
}

/**
 * Column A = YouTube URL, B = isUpdate — or swapped (B = URL, A = checkbox column).
 * @param {string[]} row
 * @returns {{ videoLink: string, videoId: string } | null}
 */
function pickPromoFromRow(row) {
  if (!Array.isArray(row) || row.length < 2) return null
  const c0 = String(row[0] ?? '').trim()
  const c1 = String(row[1] ?? '').trim()
  if (parseIsUpdate(c1)) {
    const id = extractYoutubeVideoId(c0)
    if (id) return { videoLink: c0 || `https://www.youtube.com/watch?v=${id}`, videoId: id }
  }
  if (parseIsUpdate(c0)) {
    const id = extractYoutubeVideoId(c1)
    if (id) return { videoLink: c1 || `https://www.youtube.com/watch?v=${id}`, videoId: id }
  }
  return null
}

/** First CSV row where isUpdate is true and a YouTube id is found in the paired column. */
function findPromoRow(rows) {
  for (const row of rows) {
    const picked = pickPromoFromRow(row)
    if (picked) return picked
  }
  return null
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

/**
 * Loads the **Mobile Update** tab CSV. Footer promo turns on when some row has `isUpdate` TRUE and a
 * valid YouTube URL in the other column (A/B = URL + flag, in either order). Uses the same `parseCSV`
 * as playlists so quoted cells and newlines inside fields match Google’s export.
 * If `FOOTER_PROMO_SHEET_ENABLED` is false, marks ready without fetching (UI uses static `youtubeChannel`).
 */
export async function loadFooterPromoFromSheet() {
  footerPromoSheet.ready = false
  footerPromoSheet.active = false
  footerPromoSheet.videoUrl = ''
  footerPromoSheet.videoId = ''
  footerPromoSheet.title = ''
  footerPromoSheet.description = ''

  if (!FOOTER_PROMO_SHEET_ENABLED) {
    footerPromoSheet.ready = true
    return
  }

  const sheetUrl = String(FOOTER_PROMO_SHEET_CSV_URL || '').trim()
  if (!sheetUrl) {
    footerPromoSheet.ready = true
    return
  }

  try {
    const res = await fetch(sheetUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const csvText = (await res.text()).replace(/^\uFEFF/, '')
    const rows = parseCSV(csvText)
    if (rows.length === 0) {
      footerPromoSheet.ready = true
      return
    }

    const picked = findPromoRow(rows)

    if (!picked) {
      footerPromoSheet.ready = true
      return
    }

    const { videoLink, videoId } = picked
    const videoUrl = normalizeYoutubeWatchUrl(videoLink, videoId)
    const title = (await fetchOEmbedTitle(videoUrl)) || 'Watch on YouTube'

    footerPromoSheet.videoUrl = videoUrl
    footerPromoSheet.videoId = videoId
    footerPromoSheet.title = title
    footerPromoSheet.description = ''
    footerPromoSheet.active = true
  } catch (e) {
    console.warn('[footerPromo] sheet load failed', e)
    footerPromoSheet.active = false
  } finally {
    footerPromoSheet.ready = true
  }
}

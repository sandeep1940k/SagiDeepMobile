import { reactive } from 'vue'
import { FOOTER_PROMO_SHEET_CSV_URL, FOOTER_PROMO_SHEET_ENABLED } from '../config/footerPromoSheetUrl.js'
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

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out.map((cell) => cell.replace(/^"|"$/g, '').trim())
}

function parseIsUpdate(cell) {
  const t = String(cell ?? '')
    .trim()
    .toUpperCase()
  return t === 'TRUE' || t === '1' || t === 'YES' || t === 'Y'
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
 * Loads row 2 from the sheet CSV. Shows footer promo only when column B is TRUE and column A is a valid YouTube URL.
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
    const lines = csvText.trim().split(/\r?\n/)
    if (lines.length < 2) {
      footerPromoSheet.ready = true
      return
    }

    const row = parseCsvLine(lines[1])
    const videoLink = String(row[0] || '').trim()
    if (!parseIsUpdate(row[1])) {
      footerPromoSheet.ready = true
      return
    }
    if (!videoLink) {
      footerPromoSheet.ready = true
      return
    }

    const videoId = extractYoutubeVideoId(videoLink)
    if (!videoId) {
      footerPromoSheet.ready = true
      return
    }

    const videoUrl = normalizeYoutubeWatchUrl(videoLink, videoId)
    const title = (await fetchOEmbedTitle(videoUrl)) || 'Watch on YouTube'

    footerPromoSheet.videoUrl = videoUrl
    footerPromoSheet.videoId = videoId
    footerPromoSheet.title = title
    footerPromoSheet.description = ''
    footerPromoSheet.active = true
  } catch {
    footerPromoSheet.active = false
  } finally {
    footerPromoSheet.ready = true
  }
}

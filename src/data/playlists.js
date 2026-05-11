/**
 * All playlist rows are loaded at startup from Google Sheets (CSV via Visualization API).
 * Override with `VITE_PLAYLIST_SHEET_ID` / `VITE_PLAYLIST_SHEET_NAME` in `.env`.
 *
 * `videoSrc` options:
 * - Bundled: `/videos/…/file.mp4` (under `public/videos/…`)
 * - MEGA: `https://mega.nz/file/HANDLE#KEY` (embedded in-app via MEGA’s player)
 * - Or set only `youtubeVideoId` for YouTube embed (no `videoSrc`).
 */

const DEFAULT_SHEET_ID = '147Ds6y1uAU-Dgk-IUth7TaBdpj_bWZqMLFf_MFJNpaQ'
const DEFAULT_SHEET_NAME = 'PlayList'

const SHEET_ID =
  String(import.meta.env.VITE_PLAYLIST_SHEET_ID || '').trim() || DEFAULT_SHEET_ID
const SHEET_NAME =
  String(import.meta.env.VITE_PLAYLIST_SHEET_NAME || '').trim() || DEFAULT_SHEET_NAME

export function buildPlaylistSheetCsvUrl(sheetId = SHEET_ID, sheetName = SHEET_NAME) {
  const q = new URLSearchParams({
    tqx: 'out:csv',
    sheet: sheetName,
  })
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?${q}`
}

export function parseCSV(csvText) {
  const rows = []
  let currentRow = []
  let currentValue = ''
  let insideQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"'
      i++
    } else if (char === '"') {
      insideQuotes = !insideQuotes
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentValue.trim())
      currentValue = ''
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentValue || currentRow.length > 0) {
        currentRow.push(currentValue.trim())
        rows.push(currentRow)
        currentRow = []
        currentValue = ''
      }
    } else {
      currentValue += char
    }
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue.trim())
    rows.push(currentRow)
  }

  return rows
}

const COLS = 12

function padRow(row) {
  const out = row.slice(0, COLS)
  while (out.length < COLS) out.push('')
  return out
}

/** @param {string[][]} rows — raw CSV rows including header */
export function rowsToPlaylistsById(rows) {
  const dataRows = rows.slice(1)
  /** @type {Record<string, any>} */
  const playlists = {}

  let currentPlaylistId = ''
  let currentName = ''
  let currentVariant = ''
  let currentCoverSrc = ''

  dataRows.forEach((raw) => {
    const row = padRow(raw)
    const [
      id,
      name,
      variant,
      coverSrc,
      videoId,
      videoTitle,
      videoSrc,
      thumbnailUrl,
      youtubeVideoId,
      youtubeStatsLine,
      duration,
      channelLine,
    ] = row

    if (id) currentPlaylistId = String(id).trim()
    if (name) currentName = String(name).trim()
    if (variant) currentVariant = String(variant).trim()
    if (coverSrc) currentCoverSrc = String(coverSrc).trim()

    if (!currentPlaylistId || !String(videoId || '').trim()) return

    if (!playlists[currentPlaylistId]) {
      playlists[currentPlaylistId] = {
        id: currentPlaylistId,
        name: currentName,
        variant: currentVariant,
        coverSrc: currentCoverSrc,
        videos: [],
      }
    }

    playlists[currentPlaylistId].videos.push({
      id: String(videoId).trim(),
      title: String(videoTitle || '').trim(),
      videoSrc: String(videoSrc || '').trim(),
      thumbnailUrl: String(thumbnailUrl || '').trim(),
      youtubeVideoId: String(youtubeVideoId || '').trim(),
      youtubeStatsLine: String(youtubeStatsLine || '').trim(),
      duration: String(duration || '').trim(),
      channelLine: String(channelLine || '').trim(),
    })
  })

  return playlists
}

function indexFromById(byId) {
  return Object.values(byId).map(({ id, name, variant, coverSrc, videos }) => ({
    id,
    name,
    videoCount: videos.length,
    variant,
    coverSrc,
  }))
}

export let playlistsById = {}

export let playlistsIndex = indexFromById(playlistsById)

function applyPlaylistsById(byId) {
  playlistsById = byId
  playlistsIndex = indexFromById(playlistsById)
}

/**
 * Fetches the “PlayList” tab as CSV from Google Sheets and replaces in-memory playlists.
 * On failure or empty parse, playlists stay empty (see console warning).
 */
export async function loadPlaylistsFromSheet() {
  const url = buildPlaylistSheetCsvUrl()
  const response = await fetch(url)
  if (!response.ok) {
    console.warn('[playlists] sheet fetch failed', response.status, response.statusText)
    applyPlaylistsById({})
    return
  }
  const csvText = await response.text()
  const rows = parseCSV(csvText)
  const fromSheet = rowsToPlaylistsById(rows)
  if (Object.keys(fromSheet).length === 0) {
    console.warn('[playlists] sheet parsed to no playlists (check tab name and columns)')
    applyPlaylistsById({})
    return
  }
  applyPlaylistsById(fromSheet)
}

export function getPlaylistById(id) {
  return playlistsById[String(id)] ?? null
}

export function getPlaylistVideo(playlistId, videoId) {
  const p = playlistsById[String(playlistId)]
  if (!p) return null
  return p.videos.find((v) => v.id === String(videoId)) ?? null
}

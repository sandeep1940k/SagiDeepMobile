/**
 * Playlists load **only** from Google Sheets (CSV via `gviz/tq?tqx=out:csv`). There is no bundled catalog.
 * Override with `VITE_PLAYLIST_SHEET_ID` / `VITE_PLAYLIST_SHEET_NAME`. Set `VITE_PLAYLIST_SHEET_ENABLED=0`
 * to skip the fetch (playlists stay empty).
 *
 * `videoSrc`: bundled `/videos/…`, MEGA `https://mega.nz/file/…#…`, or empty with YouTube fields.
 * Episodes: `youtubeVideoId` and trailing `youtubeVideoLink` (after `duration`).
 *
 * **List / header art:** `playlistListCoverImg()` — last episode YouTube `i.ytimg.com` thumb, else raster link.
 *
 * **Sheet layout:** Playlist fields are read from **column L onward** (columns A–K are ignored in each CSV row).
 * Same field order as before: Id, Name, … through `youtubeVideoLink` (see `padRow` / `rowsToPlaylistsById`).
 *
 * **Many rows per playlist:** CSV often repeats `Id` on every episode row, or leaves `Id`/`Name` blank on
 * continuation rows. Parser carries the active playlist; on `Id` change it resets header fields. When the
 * same `Id` repeats, playlist flags are only updated from non-empty cells so later blank cells do not clear
 * `isComingSoon` / `isPaid`. Duplicate `Videos Id` in one playlist replaces the earlier row (last row wins).
 */
import { isMegaFileOrEmbedUrl } from '../utils/megaVideo.js'
import { episodeYoutubeVideoId } from '../utils/youtubeVideoId.js'

const DEFAULT_SHEET_ID = '1qZLjU53fHVZg5Uj4ect0P5Gb29s6oJ-Mp335gUlzDPE'
const DEFAULT_SHEET_NAME = 'Sheet1'

const SHEET_ID =
  String(import.meta.env.VITE_PLAYLIST_SHEET_ID || '').trim() || DEFAULT_SHEET_ID
const SHEET_NAME =
  String(import.meta.env.VITE_PLAYLIST_SHEET_NAME || '').trim() || DEFAULT_SHEET_NAME

const SHEET_FETCH_ENABLED = import.meta.env.VITE_PLAYLIST_SHEET_ENABLED !== '0'

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

/** First playlist column in the sheet is L (1-based). Skip 11 cells (A–K) per row. */
const PLAYLIST_CSV_DATA_START = 11

/** Pad CSV rows for stable indexing (trailing columns may be empty). Data is taken from column L. */
const COLS = 20

function padRow(row) {
  const fromL = row.slice(PLAYLIST_CSV_DATA_START)
  const out = fromL.slice(0, COLS)
  while (out.length < COLS) out.push('')
  return out
}

function parseSheetTruthy(val) {
  const s = String(val ?? '').trim().toUpperCase()
  return s === 'TRUE' || s === '1' || s === 'YES'
}

/** @param {string[][]} rows — raw CSV rows including header (row 0); data from column L in each row */
export function rowsToPlaylistsById(rows) {
  const dataRows = rows.slice(1)
  /** @type {Record<string, any>} */
  const playlists = {}

  let currentPlaylistId = ''
  let currentName = ''
  let currentIsComingSoon = false
  let currentIsPaid = false
  let currentAmount = ''

  dataRows.forEach((raw) => {
    const row = padRow(raw)
    const [
      id,
      name,
      isComingSoonCell,
      isPaidCell,
      amountCell,
      videoId,
      isVideoComingSoonCell,
      videoTitle,
      videoSrc,
      youtubeVideoId,
      duration,
      youtubeVideoLink,
    ] = row

    if (id) {
      const nextId = String(id).trim()
      if (nextId !== currentPlaylistId) {
        currentPlaylistId = nextId
        currentName = String(name || '').trim()
        currentIsComingSoon = parseSheetTruthy(isComingSoonCell)
        currentIsPaid = parseSheetTruthy(isPaidCell)
        currentAmount = String(amountCell ?? '').trim()
      } else {
        if (String(name || '').trim()) currentName = String(name).trim()
        if (String(isComingSoonCell ?? '').trim() !== '') {
          currentIsComingSoon = parseSheetTruthy(isComingSoonCell)
        }
        if (String(isPaidCell ?? '').trim() !== '') {
          currentIsPaid = parseSheetTruthy(isPaidCell)
        }
        if (String(amountCell ?? '').trim() !== '') {
          currentAmount = String(amountCell ?? '').trim()
        }
      }
    } else if (String(name || '').trim()) {
      currentName = String(name).trim()
    }

    if (!currentPlaylistId) return

    if (!playlists[currentPlaylistId]) {
      playlists[currentPlaylistId] = {
        id: currentPlaylistId,
        name: currentName,
        isComingSoon: currentIsComingSoon,
        isPaid: currentIsPaid,
        amount: currentAmount,
        videos: [],
      }
    } else {
      playlists[currentPlaylistId].name = currentName
      playlists[currentPlaylistId].isComingSoon = currentIsComingSoon
      playlists[currentPlaylistId].isPaid = currentIsPaid
      playlists[currentPlaylistId].amount = currentAmount
    }

    if (!String(videoId || '').trim()) return

    const vid = String(videoId).trim()
    const list = playlists[currentPlaylistId].videos
    const dupIdx = list.findIndex((v) => v.id === vid)
    if (dupIdx !== -1) list.splice(dupIdx, 1)
    list.push({
      id: vid,
      title: String(videoTitle || '').trim(),
      videoSrc: String(videoSrc || '').trim(),
      youtubeVideoId: String(youtubeVideoId || '').trim(),
      youtubeVideoLink: String(youtubeVideoLink || '').trim(),
      duration: String(duration || '').trim(),
      channelLine: 'SagiDeep',
      isVideoComingSoon: parseSheetTruthy(isVideoComingSoonCell),
    })
  })

  return playlists
}

function youtubeHqDefaultThumb(videoId) {
  const id = String(videoId || '').trim()
  if (!id) return ''
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`
}

function lastEpisodeRasterThumb(videos) {
  if (!Array.isArray(videos) || videos.length === 0) return ''
  for (let i = videos.length - 1; i >= 0; i--) {
    if (videos[i]?.isVideoComingSoon) continue
    const u = String(videos[i]?.youtubeVideoLink || '').trim()
    if (!u || isMegaFileOrEmbedUrl(u)) continue
    return u
  }
  return ''
}

function lastEpisodeYoutubeThumb(videos) {
  if (!Array.isArray(videos) || videos.length === 0) return ''
  for (let i = videos.length - 1; i >= 0; i--) {
    if (videos[i]?.isVideoComingSoon) continue
    const id = episodeYoutubeVideoId(videos[i])
    const url = youtubeHqDefaultThumb(id)
    if (url) return url
  }
  return ''
}

/**
 * Image URL for home playlist row and playlist detail header (latest episode first when possible).
 * @param {{ videos?: unknown[] } | null | undefined} playlist
 */
export function playlistListCoverImg(playlist) {
  const videos = playlist?.videos
  const fromYt = lastEpisodeYoutubeThumb(Array.isArray(videos) ? videos : [])
  if (fromYt) return fromYt
  const raster = lastEpisodeRasterThumb(Array.isArray(videos) ? videos : [])
  if (raster) return raster
  return ''
}

function indexFromById(byId) {
  return Object.values(byId)
    .sort((a, b) =>
      String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' }),
    )
    .map((p) => {
      const { id, name, videos, isComingSoon, isPaid, amount } = p
      return {
        id,
        name,
        videoCount: videos.length,
        variant: 'blood',
        listCoverImg: playlistListCoverImg(p),
        isComingSoon: Boolean(isComingSoon),
        isPaid: Boolean(isPaid),
        amount: String(amount ?? '').trim(),
      }
    })
}

/** @type {Record<string, any>} */
export let playlistsById = {}

/** @type {ReturnType<typeof indexFromById>} */
export let playlistsIndex = indexFromById(playlistsById)

function applyPlaylistsById(byId) {
  playlistsById = byId
  playlistsIndex = indexFromById(playlistsById)
}

/**
 * Fetches the PlayList tab as CSV (`gviz/tq?tqx=out:csv`) and replaces in-memory playlists.
 * On failure, empty parse, disabled fetch, or error — catalogs are cleared (`{}`).
 */
export async function loadPlaylistsFromSheet() {
  if (!SHEET_FETCH_ENABLED) {
    console.warn('[playlists] sheet fetch disabled (VITE_PLAYLIST_SHEET_ENABLED=0); playlists empty')
    applyPlaylistsById({})
    return
  }
  const url = buildPlaylistSheetCsvUrl()
  try {
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
  } catch (e) {
    console.warn('[playlists] sheet fetch error', e)
    applyPlaylistsById({})
  }
}

export function getPlaylistById(id) {
  return playlistsById[String(id)] ?? null
}

export function getPlaylistVideo(playlistId, videoId) {
  const p = playlistsById[String(playlistId)]
  if (!p) return null
  return p.videos.find((v) => v.id === String(videoId)) ?? null
}

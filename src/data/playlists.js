/**
 * Playlists load **only** from Google Sheets (CSV via `gviz/tq?tqx=out:csv`). There is no bundled catalog.
 * Override with `VITE_PLAYLIST_SHEET_ID` / `VITE_PLAYLIST_SHEET_NAME`. Set `VITE_PLAYLIST_SHEET_ENABLED=0`
 * to skip the fetch (playlists stay empty).
 *
 * `videoSrc`: bundled `/videos/…`, MEGA `https://mega.nz/file/…#…`, or empty with YouTube fields.
 * Episodes: `youtubeVideoId` and/or optional column **`youtubeVideoLink`** (13th CSV column).
 *
 * **List / header art:** `playlistListCoverImg()` — last episode YouTube `i.ytimg.com` thumb, else raster,
 * else `coverSrc`.
 */
import { isMegaFileOrEmbedUrl } from '../utils/megaVideo.js'
import { episodeYoutubeVideoId } from '../utils/youtubeVideoId.js'

const DEFAULT_SHEET_ID = '147Ds6y1uAU-Dgk-IUth7TaBdpj_bWZqMLFf_MFJNpaQ'
const DEFAULT_SHEET_NAME = 'PlayList'

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

/** 12 base columns + optional `youtubeVideoLink` (column M). */
const COLS = 13

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
      youtubeVideoId,
      youtubeStatsLine,
      duration,
      channelLine,
      youtubeVideoLink,
    ] = row

    if (id) currentPlaylistId = String(id).trim()
    if (name) currentName = String(name).trim()
    if (variant) currentVariant = String(variant).trim()

    const coverCell = String(coverSrc || '').trim()
    if (coverCell) {
      let c = coverCell
      if (c.includes('%23') && /mega\.nz\/file\//i.test(c)) {
        try {
          c = decodeURIComponent(c)
        } catch {
          /* keep c */
        }
      }
      currentCoverSrc = c
      if (currentPlaylistId && playlists[currentPlaylistId]) {
        playlists[currentPlaylistId].coverSrc = currentCoverSrc
      }
    }

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
      youtubeVideoId: String(youtubeVideoId || '').trim(),
      youtubeVideoLink: String(youtubeVideoLink || '').trim(),
      youtubeStatsLine: String(youtubeStatsLine || '').trim(),
      duration: String(duration || '').trim(),
      channelLine: String(channelLine || '').trim(),
    })
  })

  return playlists
}

function youtubeHqDefaultThumb(videoId) {
  const id = String(videoId || '').trim()
  if (!id) return ''
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`
}

function lastEpisodeRasterThumb(videos) {
  if (!Array.isArray(videos) || videos.length === 0) return ''
  for (let i = videos.length - 1; i >= 0; i--) {
    const u = String(videos[i]?.youtubeVideoLink || '').trim()
    if (!u || isMegaFileOrEmbedUrl(u)) continue
    return u
  }
  return ''
}

function lastEpisodeYoutubeThumb(videos) {
  if (!Array.isArray(videos) || videos.length === 0) return ''
  for (let i = videos.length - 1; i >= 0; i--) {
    const id = episodeYoutubeVideoId(videos[i])
    const url = youtubeHqDefaultThumb(id)
    if (url) return url
  }
  return ''
}

/**
 * Image URL for home playlist row and playlist detail header (latest episode first when possible).
 * @param {{ coverSrc?: string, videos?: unknown[] } | null | undefined} playlist
 */
export function playlistListCoverImg(playlist) {
  const videos = playlist?.videos
  const fromYt = lastEpisodeYoutubeThumb(Array.isArray(videos) ? videos : [])
  if (fromYt) return fromYt
  const raster = lastEpisodeRasterThumb(Array.isArray(videos) ? videos : [])
  if (raster) return raster
  return String(playlist?.coverSrc || '').trim()
}

function indexFromById(byId) {
  return Object.values(byId).map((p) => {
    const { id, name, variant, coverSrc, videos } = p
    return {
      id,
      name,
      videoCount: videos.length,
      variant,
      coverSrc,
      listCoverImg: playlistListCoverImg(p),
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

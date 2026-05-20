/**
 * Playlists and episodes from SAGIDEEP_PLAYLISTS Apps Script API only (no sheet CSV catalog).
 */
import { reactive } from 'vue'
import { playlistListCoverImg } from '../data/playlists.js'
import { formatVideoDurationDisplay } from '../utils/durationDisplay.js'
import { postAppsScriptJson, readAppsScriptJson } from '../utils/appsScriptFetch.js'
import { SAGIDEEP_PLAYLISTS_URL } from './userAuth.js'

export const playlistApiState = reactive({
  loading: false,
  /** @type {Record<string, boolean>} */
  videosLoadingById: {},
  error: '',
})

export const playlistsIndex = reactive([])

/** @type {Record<string, { id: string, name: string, isComingSoon: boolean, isPaid: boolean, amount: string, videoCount: number, coverImg: string }>} */
let playlistsById = {}

/** @type {Record<string, ReturnType<typeof normalizeVideoFromApi>[]>} */
const videosByPlaylistId = {}

function sheetTruthy(v) {
  return v === true || String(v ?? '').trim().toUpperCase() === 'TRUE'
}

/** @param {unknown} v */
export function normalizeVideoFromApi(v) {
  if (!v || typeof v !== 'object') return null
  const row = /** @type {Record<string, unknown>} */ (v)
  const id = String(row.id ?? row.videoId ?? '').trim()
  if (!id) return null
  const ytId = String(row.youtubeVideoId ?? row.youtubeId ?? '').trim()
  const link = String(row.youtubeVideoLink ?? '').trim()
  const youtubeVideoLink =
    link || (ytId ? `https://www.youtube.com/watch?v=${encodeURIComponent(ytId)}` : '')
  const thumbRaw = row.thumbnailUrl ?? row.thumbnail
  const thumbnailUrl =
    thumbRaw == null || thumbRaw === '' ? '' : String(thumbRaw).trim()
  return {
    id,
    title: String(row.title ?? '').trim(),
    videoSrc: String(row.videoSrc ?? '').trim(),
    youtubeVideoId: ytId,
    youtubeVideoLink,
    thumbnailUrl,
    duration: formatVideoDurationDisplay(row.duration),
    channelLine: String(row.channelLine ?? 'SagiDeep').trim() || 'SagiDeep',
    isVideoComingSoon: sheetTruthy(row.isVideoComingSoon),
  }
}

/** @param {unknown} raw */
function normalizePlaylistMeta(raw) {
  if (!raw || typeof raw !== 'object') return null
  const p = /** @type {Record<string, unknown>} */ (raw)
  const id = String(p.id ?? p.playlistId ?? '').trim()
  if (!id) return null
  const coverFromApi = String(p.coverImg ?? p.listCoverImg ?? '').trim()
  return {
    id,
    name: String(p.name ?? '').trim(),
    isComingSoon: sheetTruthy(p.isComingSoon),
    isPaid: sheetTruthy(p.isPaid),
    amount: String(p.amount ?? '').trim(),
    videoCount: Number(p.videoCount ?? 0) || 0,
    coverImg: coverFromApi,
  }
}

function refreshPlaylistsIndex() {
  const rows = Object.values(playlistsById)
    .sort((a, b) =>
      String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' }),
    )
    .map((p) => {
      const videos = videosByPlaylistId[p.id] ?? []
      const videoCount = videos.length || p.videoCount || 0
      return {
        id: p.id,
        name: p.name,
        videoCount,
        variant: 'blood',
        listCoverImg:
          p.coverImg || playlistListCoverImg({ videos }) || '',
        isComingSoon: Boolean(p.isComingSoon),
        isPaid: Boolean(p.isPaid),
        amount: p.amount,
      }
    })
  playlistsIndex.splice(0, playlistsIndex.length, ...rows)
}

/** @param {string} id */
export function getPlaylistById(id) {
  const key = String(id ?? '').trim()
  if (!key) return null
  const meta = playlistsById[key]
  if (!meta) return null
  const videos = videosByPlaylistId[key] ?? []
  return {
    ...meta,
    videos,
    videoCount: videos.length || meta.videoCount,
  }
}

/** @param {string} playlistId @param {string} videoId */
export function getPlaylistVideo(playlistId, videoId) {
  const videos = videosByPlaylistId[String(playlistId ?? '').trim()]
  if (!videos) return null
  return videos.find((v) => v.id === String(videoId ?? '').trim()) ?? null
}

/** @param {string} playlistId */
export function getPlaylistVideos(playlistId) {
  return videosByPlaylistId[String(playlistId ?? '').trim()] ?? []
}

export function isPlaylistVideosLoading(playlistId) {
  return Boolean(playlistApiState.videosLoadingById[String(playlistId ?? '').trim()])
}

/** Load home playlist list (`doGetPlaylists`). */
export async function loadPlaylistsFromApi() {
  const url = SAGIDEEP_PLAYLISTS_URL()
  playlistApiState.loading = true
  playlistApiState.error = ''
  try {
    if (!url) {
      throw new Error('Playlist API URL is not configured')
    }
    const response = await postAppsScriptJson(url, { action: 'doGetPlaylists' })
    const data = await readAppsScriptJson(response)
    const list = Array.isArray(data?.playlists) ? data.playlists : []
    const byId = {}
    for (const raw of list) {
      const meta = normalizePlaylistMeta(raw)
      if (meta) byId[meta.id] = meta
    }
    playlistsById = byId
    refreshPlaylistsIndex()
  } catch (e) {
    playlistsById = {}
    playlistsIndex.splice(0, playlistsIndex.length)
    playlistApiState.error = String(e?.message || 'Could not load playlists')
    console.warn('[playlistApi] loadPlaylistsFromApi', e)
  } finally {
    playlistApiState.loading = false
  }
}

/**
 * Load episodes for one playlist (`doGetVideosByPlaylistId`).
 * @param {string} playlistId
 */
export async function loadPlaylistVideosFromApi(playlistId) {
  const id = String(playlistId ?? '').trim()
  if (!id) return []
  const url = SAGIDEEP_PLAYLISTS_URL()
  playlistApiState.videosLoadingById[id] = true
  try {
    if (!url) return []
    const response = await postAppsScriptJson(url, {
      action: 'doGetVideosByPlaylistId',
      playlistId: id,
    })
    const data = await readAppsScriptJson(response)
    const arr = Array.isArray(data?.videos) ? data.videos : []
    const videos = arr.map(normalizeVideoFromApi).filter(Boolean)
    videosByPlaylistId[id] = videos
    if (playlistsById[id]) {
      playlistsById[id].videoCount = videos.length
    }
    refreshPlaylistsIndex()
    return videos
  } catch (e) {
    videosByPlaylistId[id] = []
    console.warn('[playlistApi] loadPlaylistVideosFromApi', id, e)
    return []
  } finally {
    playlistApiState.videosLoadingById[id] = false
  }
}

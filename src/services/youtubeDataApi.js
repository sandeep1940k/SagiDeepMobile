/**
 * YouTube Data API v3 (public stats only).
 * Set VITE_YOUTUBE_API_KEY in .env — restrict the key in Google Cloud (API + Android app if possible).
 */

function compactNumber(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(num >= 10_000_000_000 ? 0 : 1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`
  if (num >= 10_000) return `${Math.round(num / 1_000)}K`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(Math.round(num))
}

const channelInflight = new Map()
const channelResult = new Map()

const videoInflight = new Map()
const videoResult = new Map()

/**
 * @returns {Promise<{ subscriberCount: number | null, subscriberHidden: boolean, videoCount: number | null, viewCount: number | null } | null>}
 */
export async function fetchChannelStats(handle, apiKey) {
  const h = String(handle).replace(/^@/, '').trim()
  if (!h || !apiKey) return null

  const cacheKey = h
  if (channelResult.has(cacheKey)) return channelResult.get(cacheKey)
  if (channelInflight.has(cacheKey)) return channelInflight.get(cacheKey)

  const url = new URL('https://www.googleapis.com/youtube/v3/channels')
  url.searchParams.set('part', 'statistics')
  url.searchParams.set('forHandle', h)
  url.searchParams.set('key', apiKey)

  const p = (async () => {
    const res = await fetch(url.toString())
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.error?.message || res.statusText || 'YouTube API error'
      throw new Error(msg)
    }
    const item = data.items?.[0]
    if (!item?.statistics) return null
    const s = item.statistics
    const hidden = Boolean(s.hiddenSubscriberCount)
    const out = {
      subscriberCount: hidden ? null : Number(s.subscriberCount),
      subscriberHidden: hidden,
      videoCount: s.videoCount != null ? Number(s.videoCount) : null,
      viewCount: s.viewCount != null ? Number(s.viewCount) : null,
    }
    channelResult.set(cacheKey, out)
    return out
  })().finally(() => {
    channelInflight.delete(cacheKey)
  })

  channelInflight.set(cacheKey, p)
  return p
}

/**
 * @returns {Promise<{ viewCount: number | null, likeCount: number | null, commentCount: number | null } | null>}
 */
export async function fetchVideoStats(videoId, apiKey) {
  const id = String(videoId).trim()
  if (!id || !apiKey) return null

  if (videoResult.has(id)) return videoResult.get(id)
  if (videoInflight.has(id)) return videoInflight.get(id)

  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('part', 'statistics')
  url.searchParams.set('id', id)
  url.searchParams.set('key', apiKey)

  const p = (async () => {
    const res = await fetch(url.toString())
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.error?.message || res.statusText || 'YouTube API error'
      throw new Error(msg)
    }
    const item = data.items?.[0]
    if (!item?.statistics) return null
    const s = item.statistics
    const out = {
      viewCount: s.viewCount != null ? Number(s.viewCount) : null,
      likeCount: s.likeCount != null ? Number(s.likeCount) : null,
      commentCount: s.commentCount != null ? Number(s.commentCount) : null,
    }
    videoResult.set(id, out)
    return out
  })().finally(() => {
    videoInflight.delete(id)
  })

  videoInflight.set(id, p)
  return p
}

export function formatChannelStatsLine(stats) {
  if (!stats) return ''
  const parts = []
  if (stats.subscriberHidden) parts.push('Subscribers hidden')
  else if (stats.subscriberCount != null) parts.push(`${compactNumber(stats.subscriberCount)} subscribers`)
  if (stats.videoCount != null) parts.push(`${compactNumber(stats.videoCount)} videos`)
  return parts.join(' · ')
}

export function formatVideoStatsLine(stats) {
  if (!stats) return ''
  const parts = []
  if (stats.viewCount != null) parts.push(`${compactNumber(stats.viewCount)} views`)
  if (stats.likeCount != null) parts.push(`${compactNumber(stats.likeCount)} likes`)
  if (stats.commentCount != null) parts.push(`${compactNumber(stats.commentCount)} comments`)
  return parts.join(' · ')
}

export { compactNumber }

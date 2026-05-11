/**
 * Extract an 11-character YouTube video id from a watch URL, youtu.be, embed, or shorts link.
 * @param {string} input
 * @returns {string}
 */
export function extractYoutubeVideoId(input) {
  const s = String(input || '').trim()
  if (!s) return ''
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id.length >= 11 ? id.slice(0, 11) : ''
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname.startsWith('/watch')) {
        const v = new URLSearchParams(u.search).get('v')
        return v && v.length >= 11 ? v.slice(0, 11) : ''
      }
      if (u.pathname.startsWith('/embed/')) {
        const id = u.pathname.split('/')[2] || ''
        return id.length >= 11 ? id.slice(0, 11) : ''
      }
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2] || ''
        return id.length >= 11 ? id.slice(0, 11) : ''
      }
    }
  } catch {
    /* ignore */
  }
  return ''
}

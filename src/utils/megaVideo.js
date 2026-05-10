/**
 * MEGA.nz file links are not direct MP4 URLs. In-app playback uses the embed player:
 * `https://mega.nz/file/HANDLE#KEY` → `https://mega.nz/embed/HANDLE#KEY`
 */

/** @param {string} url */
export function isMegaFileOrEmbedUrl(url) {
  return /https?:\/\/(?:www\.)?mega\.nz\/(?:file|embed)\//i.test(String(url || ''))
}

/**
 * @param {string} filePageOrEmbedUrl Full MEGA file or embed URL
 * @returns {string} embed URL for iframe src, or ''
 */
export function megaToEmbedUrl(filePageOrEmbedUrl) {
  const s = String(filePageOrEmbedUrl || '').trim()
  if (!s) return ''
  if (/\/embed\//i.test(s) && /mega\.nz/i.test(s)) return s
  if (!/\/file\//i.test(s) || !/mega\.nz/i.test(s)) return ''
  return s.replace(/\/file\//i, '/embed/')
}

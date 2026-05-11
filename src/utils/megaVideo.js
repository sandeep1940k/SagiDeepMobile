/**
 * MEGA.nz file links are not direct MP4 URLs. In-app playback uses the embed player:
 * `https://mega.nz/file/HANDLE#KEY` → `https://mega.nz/embed/HANDLE#KEY`
 */

/** @param {string} url */
export function isMegaFileOrEmbedUrl(url) {
  return /https?:\/\/(?:www\.)?mega\.nz\/(?:file|embed)\//i.test(String(url || ''))
}

/**
 * MEGA **folder** / legacy **`/#!`** links are not usable as `<img src>` or as file-embed thumbnails.
 * (`/file/` and `/embed/` use `megaFileEmbedForThumbnail` + iframe instead.)
 * @param {string} url
 */
export function isMegaNonImagePageUrl(url) {
  const s = String(url || '').trim()
  if (!s) return false
  if (!/https?:\/\/(?:www\.)?mega\.(?:nz|co\.nz)\//i.test(s)) return false
  if (/\/(?:file|embed|folder)\//i.test(s)) return true
  if (/\/#!/.test(s)) return true
  return false
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

/**
 * When `coverSrc` / thumbnail is a MEGA **file** or **embed** link, use this as `<iframe src>` (not `<img>`).
 * @param {string} url
 * @returns {string} embed URL or ''
 */
export function megaFileEmbedForThumbnail(url) {
  const s = String(url || '').trim()
  if (!isMegaFileOrEmbedUrl(s)) return ''
  return megaToEmbedUrl(s)
}

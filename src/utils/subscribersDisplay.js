/**
 * Mobile Update column C (or similar): if the cell has no “subscriber(s)” wording, append ` subscribers`.
 * @param {string} raw
 */
export function formatSubscribersDisplayLine(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  if (/subscriber/i.test(s) || /\bsubs\b/i.test(s)) return s
  return `${s} subscribers`
}

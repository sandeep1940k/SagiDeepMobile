/**
 * @param {string} [amount] — raw value from sheet (e.g. "10", "₹99", "$4.99")
 * @returns {string} line for badge, e.g. "₹10 to unlock"
 */
export function premiumUnlockPhrase(amount) {
  const raw = String(amount ?? '').trim()
  if (!raw) return 'Tap to unlock'
  if (/unlock/i.test(raw)) return raw
  if (raw.includes('₹')) return /\bto\s+unlock\b/i.test(raw) ? raw : `${raw} to unlock`
  if (/^[$€£]/.test(raw)) return /\bto\s+unlock\b/i.test(raw) ? raw : `${raw} to unlock`
  const num = raw.replace(/[^\d.]/g, '')
  if (num) return `₹${num} to unlock`
  return `${raw} to unlock`
}

/** Compact price for headers (digits-only sheet → "₹10"). */
export function premiumPriceCompact(amount) {
  const raw = String(amount ?? '').trim()
  if (!raw) return ''
  if (/[₹$€£]/.test(raw)) return raw
  const num = raw.replace(/[^\d.]/g, '')
  return num ? `₹${num}` : raw
}

/** One-line overlay for thumbnails: "Premium · ₹10" or "Premium". */
export function premiumThumbChip(amount) {
  const c = premiumPriceCompact(amount)
  return c ? `Premium · ${c}` : 'Premium'
}

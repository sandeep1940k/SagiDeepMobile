const STORAGE_PREFIX = 'sagideep_premium_unlock:'

/** @param {string | number} playlistId */
function premiumStorageKey(playlistId) {
  return `${STORAGE_PREFIX}${String(playlistId).trim()}`
}

/** Whether this playlist is unlocked on this device (placeholder until real IAP). */
export function isPremiumPlaylistUnlocked(playlistId) {
  const id = String(playlistId ?? '').trim()
  if (!id) return false
  try {
    return localStorage.getItem(premiumStorageKey(id)) === '1'
  } catch {
    return false
  }
}

/** Mark playlist as unlocked on this device (call after successful payment flow). */
export function unlockPremiumPlaylist(playlistId) {
  const id = String(playlistId ?? '').trim()
  if (!id) return
  try {
    localStorage.setItem(premiumStorageKey(id), '1')
  } catch {
    /* quota / private mode */
  }
}

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

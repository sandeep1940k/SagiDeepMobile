/**
 * Human-readable duration for list UI (VideoListItem, playlist rows).
 * Handles plain "21:21" / "1:02:03" strings and Google Sheets time cells
 * serialized as ISO strings (often `1899-12-30T…Z` when `JSON.stringify` runs on a Date).
 */

function pad2(n) {
  const x = Math.max(0, Math.min(59, Number(n) || 0))
  return String(x).padStart(2, '0')
}

function formatHms(h, m, s) {
  const hh = Math.max(0, Number(h) || 0)
  const mm = Math.max(0, Number(m) || 0)
  const ss = Math.max(0, Number(s) || 0)
  if (hh + mm + ss === 0) return ''
  if (hh > 0) return `${hh}:${pad2(mm)}:${pad2(ss)}`
  return `${mm}:${pad2(ss)}`
}

/** Sheets / Excel legacy “date-only” carrier for a time-of-day value. */
function isSpreadsheetTimeIsoString(s) {
  if (typeof s !== 'string') return false
  return (
    /^1899-12-30T/i.test(s) ||
    /^1899-12-31T/i.test(s) ||
    /^1900-01-01T/i.test(s) ||
    /^1970-01-01T/i.test(s)
  )
}

/**
 * @param {unknown} raw — string from CSV/Apps Script, or Date-like ISO string
 * @returns {string} display duration or ''
 */
export function formatVideoDurationDisplay(raw) {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'boolean') return ''

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw < 0) return ''
    if (Number.isInteger(raw) && raw < 86400) {
      const h = Math.floor(raw / 3600)
      const m = Math.floor((raw % 3600) / 60)
      const s = raw % 60
      return formatHms(h, m, s)
    }
    return ''
  }

  const s = String(raw).trim()
  if (!s) return ''

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const d = new Date(s)
    if (!Number.isFinite(d.getTime())) return ''
    if (isSpreadsheetTimeIsoString(s) || d.getUTCFullYear() < 1901) {
      return formatHms(d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())
    }
    return formatHms(d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())
  }

  if (/^\d+:\d{2}(:\d{2})?$/.test(s)) return s

  return s
}

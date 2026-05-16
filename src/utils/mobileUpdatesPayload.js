/** Flatten `{ data: {…} }` / `{ result: {…} }` for Apps Script JSON. */
export function mergeMobileUpdatesPayload(raw) {
  if (!raw || typeof raw !== 'object') return {}
  const out = { ...raw }
  if (raw.data && typeof raw.data === 'object') Object.assign(out, raw.data)
  if (raw.result && typeof raw.result === 'object') Object.assign(out, raw.result)
  return out
}

export function pickFirstStringFromObject(obj, keys) {
  if (!obj || typeof obj !== 'object') return ''
  const lowerMap = new Map(
    Object.keys(obj).map((k) => [String(k).toLowerCase(), k]),
  )
  const orderedKeys = [
    ...keys,
    ...keys.map((k) => lowerMap.get(String(k).toLowerCase())).filter(Boolean),
  ]
  const seen = new Set()
  for (const k of orderedKeys) {
    if (!k || seen.has(k)) continue
    seen.add(k)
    if (!(k in obj)) continue
    const v = obj[k]
    if (v === undefined || v === null) continue
    const s = String(typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : v)
      .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
      .replace(/\u00a0/g, ' ')
      .trim()
    if (s) return s
  }
  return ''
}

export const MOBILE_UPDATES_SUBSCRIBER_KEYS = [
  'subscribers',
  'subscribes',
  'subscriberCount',
  'subscriber_count',
  'subscriberLine',
  'subscriber_line',
]

/** Raw subscriber cell from mobile-updates web app (e.g. `100` or `"92 subscribers"`). */
export function pickMobileUpdatesSubscriberRaw(raw) {
  if (!raw || typeof raw !== 'object') return ''
  const d = mergeMobileUpdatesPayload(raw)
  return pickFirstStringFromObject(d, MOBILE_UPDATES_SUBSCRIBER_KEYS)
}

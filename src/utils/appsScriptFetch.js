/**
 * POST JSON to Google Apps Script from Capacitor WebView without CORS preflight.
 * `application/json` triggers OPTIONS; Apps Script often returns 405 for OPTIONS.
 */

const APPS_SCRIPT_POST_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'text/plain;charset=utf-8',
}

/**
 * @param {string} url
 * @param {Record<string, unknown>} body
 * @param {RequestInit} [init]
 */
export function postAppsScriptJson(url, body, init = {}) {
  return fetch(url, {
    method: 'POST',
    cache: 'no-store',
    ...init,
    headers: { ...APPS_SCRIPT_POST_HEADERS, ...(init.headers || {}) },
    body: JSON.stringify(body),
  })
}

/** @param {Response} response */
export async function readAppsScriptJson(response) {
  const text = await response.text()
  const trimmed = text.trimStart()
  if (!response.ok || trimmed.startsWith('<')) {
    throw new Error('Apps Script returned a non-JSON response')
  }
  return JSON.parse(trimmed)
}

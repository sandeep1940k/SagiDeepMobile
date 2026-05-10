import { computed, ref, unref, watch } from 'vue'
import {
  fetchChannelStats,
  fetchVideoStats,
  formatChannelStatsLine,
  formatVideoStatsLine,
} from '../services/youtubeDataApi'

function getApiKey() {
  const k = import.meta.env.VITE_YOUTUBE_API_KEY
  return typeof k === 'string' && k.trim() ? k.trim() : ''
}

function resolveEnabled(options) {
  const e = options?.enabled
  if (e == null) return true
  return typeof e === 'function' ? e() : unref(e)
}

/**
 * Loads channel subscriber / video totals for the promo card (cached across views).
 * Skips the network when `enabled` is false (e.g. you use manual text in `youtubeChannel.js`).
 * @param {import('vue').Ref<string> | (() => string) | string} handleSource
 * @param {{ enabled?: import('vue').Ref<boolean> | import('vue').ComputedRef<boolean> | (() => boolean) }} [options]
 */
export function useYoutubeChannelRuntimeStats(handleSource, options = {}) {
  const loading = ref(false)
  const error = ref(null)
  const stats = ref(null)

  function resolveHandle() {
    if (typeof handleSource === 'function') return handleSource()
    return unref(handleSource)
  }

  async function load() {
    if (!resolveEnabled(options)) {
      stats.value = null
      loading.value = false
      return
    }
    const apiKey = getApiKey()
    const handle = resolveHandle()
    if (!apiKey || !handle) {
      stats.value = null
      return
    }
    loading.value = true
    error.value = null
    try {
      stats.value = await fetchChannelStats(handle, apiKey)
    } catch (e) {
      error.value = e
      stats.value = null
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [resolveHandle(), resolveEnabled(options)],
    load,
    { immediate: true },
  )

  const line = computed(() => formatChannelStatsLine(stats.value))

  return { loading, error, stats, line }
}

/**
 * Loads view / like / comment counts for a YouTube video id (watch page).
 * @param {import('vue').Ref<string> | (() => string) | string} videoIdSource
 * @param {{ enabled?: import('vue').Ref<boolean> | import('vue').ComputedRef<boolean> | (() => boolean) }} [options]
 */
export function useYoutubeVideoRuntimeStats(videoIdSource, options = {}) {
  const loading = ref(false)
  const error = ref(null)
  const stats = ref(null)

  function resolveId() {
    if (typeof videoIdSource === 'function') return videoIdSource()
    return unref(videoIdSource)
  }

  async function load() {
    if (!resolveEnabled(options)) {
      stats.value = null
      loading.value = false
      return
    }
    const apiKey = getApiKey()
    const id = resolveId()
    if (!apiKey || !id) {
      stats.value = null
      return
    }
    loading.value = true
    error.value = null
    try {
      stats.value = await fetchVideoStats(id, apiKey)
    } catch (e) {
      error.value = e
      stats.value = null
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [resolveId(), resolveEnabled(options)],
    load,
    { immediate: true },
  )

  const line = computed(() => formatVideoStatsLine(stats.value))

  return { loading, error, stats, line }
}

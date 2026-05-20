<script setup>
import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { openYoutubeWatchPreferApp } from '../utils/openYoutubeWatch'
import PageSkeleton from '../components/PageSkeleton.vue'
import { FOOTER_PROMO_SHEET_ENABLED } from '../config/config.js'
import { footerPromoSheet } from '../data/footerPromoSheet.js'
import {
  getPlaylistById,
  getPlaylistVideo,
  loadPlaylistVideosFromApi,
  playlistApiState,
} from '../services/playlistApi.js'
import { isPremiumPlaylistUnlocked } from '../utils/premiumUnlock.js'
import { youtubeChannel } from '../data/youtubeChannel'
import {
  fetchAndSyncMobileUpdatesChannelStats,
  mobileUpdatesChannelSync,
} from '../data/mobileUpdatesChannelSync.js'
import {
  useYoutubeChannelRuntimeStats,
  useYoutubeVideoRuntimeStats,
} from '../composables/useYoutubeRuntimeStats'
import { isMegaFileOrEmbedUrl, megaToEmbedUrl } from '../utils/megaVideo'
import { formatSubscribersDisplayLine } from '../utils/subscribersDisplay.js'
import { episodeYoutubeVideoId } from '../utils/youtubeVideoId.js'
import { SAGIDEEP_TRACKING_URL } from '../services/userAuth.js'
import { fetchPublicIp } from '../services/sheetClickIpTrack.js'
import { postAppsScriptJson } from '../utils/appsScriptFetch.js'

const route = useRoute()
const router = useRouter()
const videoEl = ref(null)
const megaIframeEl = ref(null)
const megaIframeFs = ref(false)
const youtubeRootEl = ref(null)
const youtubeEmbedFs = ref(false)
const loadError = ref(false)
const liked = ref(false)
const shareHint = ref(false)

const playlist = computed(() => getPlaylistById(route.params.playlistId))
const video = computed(() =>
  getPlaylistVideo(route.params.playlistId, route.params.videoId),
)

const watchBootstrapLoading = computed(
  () => playlistApiState.loading && !(video.value && playlist.value),
)

watch(
  () => [
    String(route.params.playlistId ?? ''),
    Boolean(playlist.value?.isPaid),
    Boolean(playlist.value?.isComingSoon),
  ],
  ([pid, paid, soon]) => {
    if (!pid || soon || !paid) return
    if (isPremiumPlaylistUnlocked(pid)) return
    router.replace({ name: 'playlist', params: { id: pid } })
  },
  { immediate: true },
)

watch(
  () => [String(route.params.playlistId ?? ''), Boolean(playlist.value?.isComingSoon)],
  ([pid, soon]) => {
    if (!pid || !soon) return
    router.replace({ name: 'playlist', params: { id: pid } })
  },
  { immediate: true },
)

watch(
  () => [
    String(route.params.playlistId ?? ''),
    String(route.params.videoId ?? ''),
    Boolean(video.value?.isVideoComingSoon),
  ],
  ([pid, vid, vSoon]) => {
    if (!pid || !vid || !vSoon) return
    router.replace({ name: 'playlist', params: { id: pid } })
  },
  { immediate: true },
)

const resolvedYoutubeVideoId = computed(() => episodeYoutubeVideoId(video.value))

const hasVideoFile = computed(() => Boolean(String(video.value?.videoSrc || '').trim()))
const hasYoutubeId = computed(() => Boolean(resolvedYoutubeVideoId.value))
/** Episode plays if there is a file path or a YouTube id (embed). */
const showPlayer = computed(() => hasVideoFile.value || hasYoutubeId.value)
/** In-app YouTube iframe when there is no local/stream `videoSrc`. */
const useYoutubeEmbed = computed(() => {
  if (loadError.value) return false
  return hasYoutubeId.value && !hasVideoFile.value
})
const youtubeEmbedSrc = computed(() => {
  const id = resolvedYoutubeVideoId.value
  if (!id) return ''
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?playsinline=1&rel=0`
})

const isMegaVideoSrc = computed(() => isMegaFileOrEmbedUrl(video.value?.videoSrc))
/** MEGA file links use their embed player inside the WebView (not `<video src>`). */
const useMegaEmbed = computed(() => {
  if (loadError.value) return false
  return isMegaVideoSrc.value
})
const megaEmbedSrc = computed(() => megaToEmbedUrl(String(video.value?.videoSrc || '')))

/** Prefer configured `youtubeVideoLink`, else canonical watch URL from resolved id. */
const shareUrl = computed(() => {
  const link = String(video.value?.youtubeVideoLink || '').trim()
  if (/^https?:\/\//i.test(link)) return link
  const ytId = resolvedYoutubeVideoId.value
  if (ytId) return `https://www.youtube.com/watch?v=${ytId}`
  return window.location.href
})

const youtubeWatchUrl = computed(() => {
  const ytId = resolvedYoutubeVideoId.value
  return ytId ? `https://www.youtube.com/watch?v=${ytId}` : ''
})

const sheetSubscribersLine = computed(() => {
  if (!FOOTER_PROMO_SHEET_ENABLED || !footerPromoSheet.ready) return ''
  return String(footerPromoSheet.subscribersLine || '').trim()
})

/** Same as `YoutubeChannelPromo` / `GlobalFooter` — from `SAGIDEEP_MOBILE_UPDATES` JSON. */
const mobileUpdatesSubscriberCell = computed(() =>
  String(mobileUpdatesChannelSync.subscriberCell || '').trim(),
)

const channelStatsFromApiEnabled = computed(() => {
  if (mobileUpdatesSubscriberCell.value) return false
  if (sheetSubscribersLine.value) return false
  if (FOOTER_PROMO_SHEET_ENABLED) return true
  return !String(youtubeChannel.manualStatsLine || '').trim()
})
const { loading: channelStatsLoading, line: channelApiStatsLine } = useYoutubeChannelRuntimeStats(
  () => youtubeChannel.handle,
  { enabled: channelStatsFromApiEnabled },
)
const channelDisplayStatsLine = computed(() => {
  if (mobileUpdatesSubscriberCell.value)
    return formatSubscribersDisplayLine(mobileUpdatesSubscriberCell.value)
  if (sheetSubscribersLine.value) return formatSubscribersDisplayLine(sheetSubscribersLine.value)
  if (FOOTER_PROMO_SHEET_ENABLED && !footerPromoSheet.ready) return ''
  if (FOOTER_PROMO_SHEET_ENABLED && footerPromoSheet.ready) return channelApiStatsLine.value
  return String(youtubeChannel.manualStatsLine || '').trim() || channelApiStatsLine.value
})

const videoStatsFromApiEnabled = computed(() => Boolean(resolvedYoutubeVideoId.value))
const { loading: videoStatsLoading, line: videoApiStatsLine } = useYoutubeVideoRuntimeStats(
  () => resolvedYoutubeVideoId.value,
  { enabled: videoStatsFromApiEnabled },
)
const videoDisplayStatsLine = computed(() => videoApiStatsLine.value)

async function openYoutubeWatch() {
  if (!youtubeWatchUrl.value) return
  await openYoutubeWatchPreferApp(resolvedYoutubeVideoId.value)
}

function isOurVideoFullscreen() {
  const v = videoEl.value
  if (!v) return false
  const fs = document.fullscreenElement
  if (!fs) return false
  if (fs === v) return true
  try {
    return Boolean(fs.contains?.(v))
  } catch {
    return false
  }
}

function isMegaIframeDocumentFullscreen() {
  const iframe = megaIframeEl.value
  if (!iframe) return false
  const fs = document.fullscreenElement
  if (!fs) return false
  if (fs === iframe) return true
  try {
    return Boolean(fs.contains?.(iframe))
  } catch {
    return false
  }
}

function isYoutubeEmbedDocumentFullscreen() {
  const root = youtubeRootEl.value
  if (!root) return false
  const fs = document.fullscreenElement
  if (!fs) return false
  if (fs === root) return true
  try {
    return Boolean(fs.contains?.(root))
  } catch {
    return false
  }
}

async function applyOrientationForFullscreen(entering) {
  if (entering) {
    if (Capacitor.isNativePlatform()) {
      try {
        await ScreenOrientation.lock({ orientation: 'landscape' })
      } catch {
        /* WebView/OS may refuse; user can still rotate manually */
      }
    } else {
      try {
        await screen.orientation?.lock?.('landscape')
      } catch {
        /* Browser may require transient activation */
      }
    }
    return
  }
  if (Capacitor.isNativePlatform()) {
    try {
      await ScreenOrientation.unlock()
    } catch {
      /* ignore */
    }
  } else {
    try {
      screen.orientation?.unlock?.()
    } catch {
      /* ignore */
    }
  }
}

function onDocumentFullscreenChange() {
  megaIframeFs.value = isMegaIframeDocumentFullscreen()
  youtubeEmbedFs.value = isYoutubeEmbedDocumentFullscreen()
  const anyFs =
    isOurVideoFullscreen() || megaIframeFs.value || youtubeEmbedFs.value
  void applyOrientationForFullscreen(anyFs)
}

async function toggleMegaIframeFullscreen() {
  const el = megaIframeEl.value
  if (!el) return
  try {
    if (document.fullscreenElement === el) {
      await document.exitFullscreen()
      return
    }
    /* Same user gesture: lock landscape first so the device rotates with fullscreen (native + capable browsers). */
    await applyOrientationForFullscreen(true)
    if (el.requestFullscreen) {
      await el.requestFullscreen()
      return
    }
    // Safari / older WebKit
    el.webkitRequestFullscreen?.()
  } catch {
    void applyOrientationForFullscreen(false)
  }
}

async function toggleYoutubeEmbedFullscreen() {
  const el = youtubeRootEl.value
  if (!el) return
  try {
    if (document.fullscreenElement === el) {
      await document.exitFullscreen()
      return
    }
    await applyOrientationForFullscreen(true)
    if (el.requestFullscreen) {
      await el.requestFullscreen()
    }
  } catch {
    void applyOrientationForFullscreen(false)
  }
}

function attachVideoOrientationListeners(el) {
  const onBegin = () => void applyOrientationForFullscreen(true)
  const onEnd = () => void applyOrientationForFullscreen(false)
  el.addEventListener('webkitbeginfullscreen', onBegin)
  el.addEventListener('webkitendfullscreen', onEnd)
  return () => {
    el.removeEventListener('webkitbeginfullscreen', onBegin)
    el.removeEventListener('webkitendfullscreen', onEnd)
  }
}

let removeVideoOrientationListeners = () => {}

onBeforeMount(async () => {
  const url = SAGIDEEP_TRACKING_URL()
  if (!url) {
    return
  }
  try {
    const ip = await fetchPublicIp();
    const response = await postAppsScriptJson(url, {
      ipAddress: ip,
      activity: 'viewed_video',
    })
    // const data = await response.json()
    console.log(response)
  } catch (error) {
    console.error(error)
  }
})
onMounted(async () => {
  const pid = String(route.params.playlistId ?? '').trim()
  if (pid && !video.value) await loadPlaylistVideosFromApi(pid)
  document.addEventListener('fullscreenchange', onDocumentFullscreenChange)
  void fetchAndSyncMobileUpdatesChannelStats()
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onDocumentFullscreenChange)
  removeVideoOrientationListeners()
  removeVideoOrientationListeners = () => {}
  const iframe = megaIframeEl.value
  if (iframe && document.fullscreenElement === iframe) {
    void document.exitFullscreen()
  }
  const ytRoot = youtubeRootEl.value
  if (ytRoot && document.fullscreenElement === ytRoot) {
    void document.exitFullscreen()
  }
  void applyOrientationForFullscreen(false)
})

watch(videoEl, (el) => {
  removeVideoOrientationListeners()
  removeVideoOrientationListeners = () => {}
  if (el) removeVideoOrientationListeners = attachVideoOrientationListeners(el)
})

watch(
  () => [route.params.playlistId, route.params.videoId],
  () => {
    loadError.value = false
    liked.value = false
    scrubberTime.value = 0
    videoDuration.value = 0
    isSeeking.value = false
    isNativePlaying.value = false
    megaIframeFs.value = false
    youtubeEmbedFs.value = false
    const iframe = megaIframeEl.value
    if (iframe && document.fullscreenElement === iframe) {
      void document.exitFullscreen()
    }
    const ytRoot = youtubeRootEl.value
    if (ytRoot && document.fullscreenElement === ytRoot) {
      void document.exitFullscreen()
    }
    videoEl.value?.load?.()
    void applyOrientationForFullscreen(false)
  },
)

/** Custom controls for native `<video>` (fat-finger seek bar; default controls are flaky in WebView). */
const videoDuration = ref(0)
const scrubberTime = ref(0)
const isSeeking = ref(false)
const isNativePlaying = ref(false)

function formatClock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

function onNativeLoadedMetadata() {
  const v = videoEl.value
  videoDuration.value = v?.duration && Number.isFinite(v.duration) ? v.duration : 0
  scrubberTime.value = v?.currentTime ?? 0
}

function onNativeTimeUpdate() {
  if (isSeeking.value) return
  const v = videoEl.value
  if (v && Number.isFinite(v.currentTime)) scrubberTime.value = v.currentTime
}

function onSeekPointerDown() {
  isSeeking.value = true
}

function onSeekPointerUp() {
  isSeeking.value = false
  const v = videoEl.value
  if (v && Number.isFinite(v.currentTime)) scrubberTime.value = v.currentTime
}

function onSeekInput(e) {
  const t = Number(e.target.value)
  scrubberTime.value = t
  const v = videoEl.value
  if (v) {
    try {
      v.currentTime = t
    } catch {
      /* ignore */
    }
  }
}

function toggleNativePlay() {
  const v = videoEl.value
  if (!v) return
  if (v.paused) void v.play()
  else v.pause()
}

async function toggleNativeFullscreen() {
  const v = videoEl.value
  if (!v) return
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await applyOrientationForFullscreen(true)
    if (typeof v.webkitEnterFullscreen === 'function') {
      v.webkitEnterFullscreen()
      return
    }
    if (v.requestFullscreen) {
      await v.requestFullscreen()
    }
  } catch {
    void applyOrientationForFullscreen(false)
  }
}

function onVideoError() {
  loadError.value = true
}

function goBack() {
  if (window.history.length > 1) router.back()
  else if (playlist.value) router.push({ name: 'playlist', params: { id: playlist.value.id } })
  else router.push({ name: 'home' })
}

/**
 * YouTube does not allow real like/share from our WebView; open this episode on YouTube (app on phones / new tab on desktop).
 */
async function onLikeToggle() {
  if (!resolvedYoutubeVideoId.value) return

  liked.value = !liked.value
  await openYoutubeWatch()
}

async function onShare() {
  const title = video.value?.title ?? 'Video'
  const url = shareUrl.value

  if (resolvedYoutubeVideoId.value) {
    await openYoutubeWatch()
    return
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text: title, url })
      return
    } catch {
      /* user cancelled or error */
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    shareHint.value = true
    window.setTimeout(() => {
      shareHint.value = false
    }, 2000)
  } catch {
    shareHint.value = true
    window.setTimeout(() => {
      shareHint.value = false
    }, 2000)
  }
}
</script>

<template>
  <div class="watch">
    <header class="watch__top">
      <button type="button" class="watch__back" @click="goBack">‹ Back</button>
    </header>

    <div v-if="watchBootstrapLoading" class="watch__body">
      <PageSkeleton variant="watch" />
    </div>

    <div v-else-if="video && playlist" class="watch__body">
      <div v-if="showPlayer && !loadError" class="watch__player-wrap">
        <div v-if="useMegaEmbed && megaEmbedSrc" class="watch__mega">
          <div class="watch__mega-embed">
            <iframe
              ref="megaIframeEl"
              :key="megaEmbedSrc"
              class="watch__mega-iframe"
              title="MEGA video"
              :src="megaEmbedSrc"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div class="watch__mega-tools" role="toolbar" aria-label="MEGA player helpers">
            <button
              type="button"
              class="watch__mega-tool-btn"
              @click="toggleMegaIframeFullscreen"
            >
              {{ megaIframeFs ? 'Exit fullscreen' : 'Fullscreen' }}
            </button>
            <span class="watch__mega-tip">
              Tap the video to play or pause — toolbar icons can be tight on small screens.
            </span>
          </div>
        </div>
        <div v-else-if="useYoutubeEmbed" class="watch__mega">
          <div ref="youtubeRootEl" class="watch__yt-embed">
            <iframe
              :key="youtubeEmbedSrc"
              class="watch__yt-iframe"
              title="YouTube video"
              :src="youtubeEmbedSrc"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div class="watch__mega-tools" role="toolbar" aria-label="YouTube player helpers">
            <button
              type="button"
              class="watch__mega-tool-btn"
              @click="toggleYoutubeEmbedFullscreen"
            >
              {{ youtubeEmbedFs ? 'Exit fullscreen' : 'Fullscreen' }}
            </button>
            <span class="watch__mega-tip">Locks landscape on your phone, then fills the screen.</span>
          </div>
        </div>
        <div v-else class="watch__native">
          <video
            ref="videoEl"
            class="watch__video watch__video--native"
            playsinline
            webkit-playsinline
            :poster="video.thumbnailUrl || undefined"
            :src="video.videoSrc"
            preload="metadata"
            @error="onVideoError"
            @loadedmetadata="onNativeLoadedMetadata"
            @timeupdate="onNativeTimeUpdate"
            @play="isNativePlaying = true"
            @pause="isNativePlaying = false"
            @ended="isNativePlaying = false"
          >
            Your browser does not support embedded video.
          </video>
          <div class="watch__native-ui" @click.stop>
            <input
              type="range"
              class="watch__seek"
              aria-label="Seek"
              :min="0"
              :max="Math.max(videoDuration, 0.01)"
              step="any"
              :value="scrubberTime"
              @pointerdown="onSeekPointerDown"
              @pointerup="onSeekPointerUp"
              @pointercancel="onSeekPointerUp"
              @touchstart.passive="onSeekPointerDown"
              @touchend="onSeekPointerUp"
              @input="onSeekInput"
            />
            <div class="watch__native-row">
              <button
                type="button"
                class="watch__native-icon-btn"
                :aria-label="isNativePlaying ? 'Pause' : 'Play'"
                @click="toggleNativePlay"
              >
                <svg v-if="!isNativePlaying" class="watch__native-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
                <svg v-else class="watch__native-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
              <span class="watch__native-time" aria-live="polite">
                {{ formatClock(scrubberTime) }} / {{ formatClock(videoDuration) }}
              </span>
              <button
                type="button"
                class="watch__native-icon-btn"
                aria-label="Fullscreen"
                @click="toggleNativeFullscreen"
              >
                <svg class="watch__native-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="hasVideoFile && loadError" class="watch__missing">
        <p class="watch__missing-title">Could not load video file</p>
        <p class="watch__missing-text">
          Check <code>videoSrc</code> in <code>playlists.js</code>: bundled path like
          <code>public/videos/…/file.mp4</code> or a valid stream URL (not MEGA — MEGA uses the embed
          player above).
        </p>
      </div>

      <div v-else-if="!showPlayer" class="watch__missing">
        <p class="watch__missing-title">No video configured</p>
        <p class="watch__missing-text">
          Set <code>videoSrc</code> (bundled MP4, MEGA <code>/file/…</code> link),
          <code>youtubeVideoId</code>, or <code>youtubeVideoLink</code> in
          <code>src/data/playlists.js</code> for this episode.
        </p>
      </div>

      <div class="watch__info">
        <h1 class="watch__title">{{ video.title }}</h1>

        <p
          v-if="youtubeWatchUrl && (videoDisplayStatsLine || videoStatsLoading)"
          class="watch__yt-metrics"
        >
          {{ videoStatsLoading ? 'Loading YouTube stats…' : videoDisplayStatsLine }}
        </p>

        <div class="watch__creator">
          <img
            class="watch__avatar"
            :src="youtubeChannel.avatarUrl"
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <div class="watch__creator-text">
            <span class="watch__creator-name">{{ youtubeChannel.displayName }}</span>
            <span class="watch__creator-handle">@{{ youtubeChannel.handle }}</span>
            <span
              v-if="channelDisplayStatsLine || channelStatsLoading"
              class="watch__creator-stats"
            >
              {{ channelStatsLoading ? 'Loading…' : channelDisplayStatsLine }}
            </span>
          </div>
          <a
            class="watch__subscribe"
            :href="youtubeChannel.subscribeUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Subscribe
          </a>
        </div>

        <div class="watch__actions">
          <button
            type="button"
            class="watch__action"
            :class="{ 'watch__action--on': liked }"
            :aria-pressed="liked"
            @click="onLikeToggle"
          >
            <svg
              class="watch__action-icon"
              :class="{ 'watch__action-icon--dim': !liked }"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.82 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
              />
            </svg>
            <span>Like</span>
          </button>

          <button type="button" class="watch__action" @click="onShare">
            <svg class="watch__action-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"
              />
            </svg>
            <span>Share</span>
          </button>
        </div>

        <p v-if="shareHint" class="watch__toast" role="status">Link copied</p>

        <!-- Comments live on YouTube; tap opens watch page (posting needs YouTube sign-in). -->
        <section v-if="youtubeWatchUrl" class="watch__comments" aria-label="Comments">
          <div class="watch__comments-head">
            <h2 class="watch__comments-title">Comments</h2>
            <span class="watch__comments-hint">On YouTube</span>
          </div>
          <button
            type="button"
            class="watch__comment-composer"
            @click="openYoutubeWatch"
          >
            <img
              class="watch__comment-avatar"
              :src="youtubeChannel.avatarUrl"
              alt=""
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <span class="watch__comment-placeholder">Add a comment…</span>
            <svg class="watch__comment-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
              />
            </svg>
          </button>
          <p class="watch__comments-note">
            Opens this video in YouTube so you can read comments and post while signed in.
          </p>
        </section>
      </div>
    </div>

    <div v-else class="watch__body watch__body--empty">
      <p>Video not found.</p>
      <button type="button" class="watch__back" @click="goBack">Go back</button>
    </div>
  </div>
</template>

<style scoped>
.watch {
  min-height: 100dvh;
  min-height: 100vh;
  background: #0f0f0f;
  color: #f1f1f1;
  padding: max(8px, env(safe-area-inset-top)) 12px max(20px, env(safe-area-inset-bottom));
  max-width: 720px;
  margin: 0 auto;
  box-sizing: border-box;
}

.watch__top {
  margin-bottom: 12px;
}

.watch__back {
  border: none;
  background: transparent;
  color: #f1f1f1;
  font-size: 16px;
  font-weight: 600;
  padding: 8px 4px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.watch__back:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.5);
  border-radius: 6px;
}

.watch__player-wrap {
  width: 100%;
  min-width: 0;
}

.watch__mega {
  min-width: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
}

/*
 * MEGA’s embed draws its own play/pause + toolbar inside the iframe. On very narrow widths their
 * layout can clip the left control cluster; avoid clipping here and give a bit more height on
 * phones so the internal player has room.
 */
.watch__mega-embed {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: min(72vh, 100dvh - 120px);
  margin-inline: auto;
  background: #000;
  overflow: visible;
}

.watch__mega-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #000;
}

@media (max-width: 480px) {
  .watch__mega-embed {
    /* Slightly taller than 16:9 so MEGA’s chrome is less cramped (helps play/pause visibility). */
    aspect-ratio: 16 / 10;
    max-height: min(78vh, 100dvh - 96px);
  }
}

.watch__mega-tools {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px 12px;
  background: #141414;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.watch__mega-tool-btn {
  flex-shrink: 0;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #f1f1f1;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.watch__mega-tool-btn:active {
  background: rgba(255, 255, 255, 0.16);
}

.watch__mega-tool-btn:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.55);
  outline-offset: 2px;
}

.watch__mega-tip {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #9a9a9a;
}

.watch__yt-embed {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.watch__yt-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.watch__native {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.watch__video--native {
  width: 100%;
  max-height: min(56.25vw, 52vh);
  border-radius: 0;
  background: #000;
  display: block;
}

.watch__native-ui {
  padding: 12px 12px 14px;
  background: #141414;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Large touch target + full-width clickable seek (mobile WebView friendly). */
.watch__seek {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 40px;
  margin: 0 0 10px;
  padding: 0;
  cursor: pointer;
  background: transparent;
  touch-action: none;
}

.watch__seek::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.18);
}

.watch__seek::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  margin-top: -6px;
  border-radius: 50%;
  background: #e62117;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
}

.watch__seek::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.18);
}

.watch__seek::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: #e62117;
}

.watch__native-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.watch__native-time {
  flex: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #e8e8e8;
}

.watch__native-icon-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: #f1f1f1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.watch__native-icon-btn:active {
  background: rgba(255, 255, 255, 0.14);
}

.watch__native-icon-btn:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.55);
  outline-offset: 2px;
}

.watch__native-svg {
  width: 26px;
  height: 26px;
  display: block;
}

.watch__missing {
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  background: #1a1a1a;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
}

.watch__missing-title {
  margin: 0 0 8px;
  font-weight: 700;
}

.watch__missing-text {
  margin: 0;
  font-size: 13px;
  color: #aaa;
  line-height: 1.45;
  max-width: 42ch;
}

.watch__missing-text code {
  font-size: 11px;
  color: #e8d5a3;
  word-break: break-all;
}

.watch__info {
  margin-top: 14px;
}

.watch__title {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.3;
}

.watch__yt-metrics {
  margin: 0 0 14px;
  font-size: 13px;
  color: #aaa;
  line-height: 1.35;
  font-variant-numeric: tabular-nums;
}

.watch__creator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.watch__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #222;
}

.watch__creator-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.watch__creator-name {
  font-size: 15px;
  font-weight: 600;
  color: #f1f1f1;
}

.watch__creator-handle {
  font-size: 12px;
  color: #aaa;
}

.watch__creator-stats {
  font-size: 12px;
  color: #717171;
  line-height: 1.35;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

.watch__subscribe {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  color: #fff;
  background: #ff0000;
  -webkit-tap-highlight-color: transparent;
}

.watch__subscribe:active {
  filter: brightness(0.88);
}

.watch__subscribe:focus-visible {
  outline: 2px solid #3ea6ff;
  outline-offset: 2px;
}

.watch__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.watch__action {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 8px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #f1f1f1;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.watch__action:active {
  background: rgba(255, 255, 255, 0.12);
}

.watch__action:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.5);
  outline-offset: 2px;
}

.watch__action--on {
  color: #3ea6ff;
  background: rgba(62, 166, 255, 0.12);
}

.watch__action-icon {
  width: 24px;
  height: 24px;
}

.watch__action-icon--dim {
  opacity: 0.45;
}

.watch__toast {
  margin: 10px 0 0;
  font-size: 13px;
  color: #3ea6ff;
}

.watch__comments {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.watch__comments-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.watch__comments-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #f1f1f1;
}

.watch__comments-hint {
  font-size: 12px;
  color: #aaa;
  font-weight: 500;
}

.watch__comment-composer {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #aaa;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.watch__comment-composer:active {
  background: rgba(255, 255, 255, 0.1);
}

.watch__comment-composer:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.5);
  outline-offset: 2px;
}

.watch__comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #222;
}

.watch__comment-placeholder {
  flex: 1;
  min-width: 0;
  color: #aaa;
}

.watch__comment-chevron {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  opacity: 0.6;
}

.watch__comments-note {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #717171;
}

.watch__body--empty {
  text-align: center;
  padding-top: 48px;
  color: #aaa;
}
</style>

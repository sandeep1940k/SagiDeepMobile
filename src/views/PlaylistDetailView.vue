<template>
  <div v-if="showShell" class="shell">
    <div class="shell__glow" aria-hidden="true" />

    <header class="top">
      <button type="button" class="top__back" @click="goBack">‹ Back</button>
    </header>

    <PageSkeleton v-if="playlistPageLoading" variant="playlist" :rows="6" />

    <template v-else>
    <div
      class="head"
      :class="{
        'head--soon': sheetPlaylist?.isComingSoon,
        'head--paid': sheetPlaylist?.isPaid && !sheetPlaylist?.isComingSoon,
      }"
    >
      <div class="head__thumb-wrap">
        <img
          v-if="heroCoverSrc"
          :src="heroCoverSrc"
          class="head__thumb"
          :alt="displayTitle"
          loading="lazy"
        />
        <div
          v-else
          class="head__thumb head__thumb--placeholder"
          :class="{ 'head__thumb--soon-ph': sheetPlaylist?.isComingSoon }"
        />
        <div
          v-if="sheetPlaylist?.isPaid && !sheetPlaylist?.isComingSoon"
          class="head__premium-badge"
          aria-hidden="true"
        >
          <span class="head__premium-chip">{{ premiumChipText }}</span>
        </div>
        <div v-if="sheetPlaylist?.isComingSoon" class="head__soon-veil" aria-hidden="true">
          <span class="head__soon-chip" role="status">
            <span class="head__soon-chip-line">Coming</span>
            <span class="head__soon-chip-line">soon</span>
          </span>
        </div>
      </div>
      <div class="head__text">
        <h1 class="head__title">{{ displayTitle }}</h1>
        <p
          v-if="sheetPlaylist?.isPaid && !sheetPlaylist?.isComingSoon"
          class="head__premium-note"
        >
          Unlock to watch
        </p>
        <button
          v-if="playlistPremiumLocked"
          type="button"
          class="head__unlock-btn"
          @click="onUnlockPlaylist"
        >
          Unlock
          <template v-if="premiumPriceShort"> · {{ premiumPriceShort }}</template>
        </button>
        <p class="head__meta">
          <template v-if="sheetPlaylist?.isComingSoon">Episodes arrive soon · Stay tuned</template>
          <template v-else>
            {{ apiVideos.length === 1 ? '1 video' : `${apiVideos.length} videos` }} · Playlist
          </template>
        </p>
      </div>
    </div>

    <section
      v-if="!sheetPlaylist?.isComingSoon && apiVideos.length"
      class="list"
      aria-label="Videos in playlist"
    >
      <h2 class="list__label">Videos</h2>
      <ul class="list__ul">
        <li v-for="v in apiVideos" :key="v.id">
          <VideoListItem
            :playlist-id="routeId"
            :video-id="v.id"
            :title="v.title"
            :thumbnail-url="v.thumbnailUrl || ''"
            :youtube-video-id="v.youtubeVideoId || ''"
            :youtube-video-link="v.youtubeVideoLink || ''"
            :channel-line="v.channelLine"
            :duration="v.duration || ''"
            :is-video-coming-soon="Boolean(v.isVideoComingSoon)"
            :playlist-premium-locked="playlistPremiumLocked"
          />
        </li>
      </ul>
    </section>

    <section v-else-if="sheetPlaylist?.isComingSoon" class="soon" aria-labelledby="soon-heading">
      <div class="soon__card">
        <h2 id="soon-heading" class="soon__title">Not available yet</h2>
        <p class="soon__copy">
          This playlist is still being prepared. Episodes will appear here once they are ready.
          <template v-if="sheetPlaylist?.isPaid">
            <br />
            <span class="soon__paid-hint">
              <template v-if="premiumPriceShort">{{ premiumPriceShort }} when available.</template>
              <template v-else>Paid access when available.</template>
            </span>
          </template>
        </p>
      </div>
    </section>
    </template>
  </div>

  <div v-else-if="showEmpty" class="shell shell--empty">
    <p class="empty__text">Playlist not found.</p>
    <RouterLink :to="{ name: 'home' }" class="empty__link">Go home</RouterLink>
  </div>
</template>

<script setup>
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getPlaylistById, playlistListCoverImg, playlistsSheetState } from '../data/playlists'
import PageSkeleton from '../components/PageSkeleton.vue'
import VideoListItem from '../components/VideoListItem.vue'
import {
  isPremiumPlaylistUnlocked,
  premiumPriceCompact,
  premiumThumbChip,
  unlockPremiumPlaylist,
} from '../utils/premiumUnlock.js'
import { SAGIDEEP_PLAYLISTS_URL, SAGIDEEP_TRACKING_URL } from '../services/userAuth.js'
import { formatVideoDurationDisplay } from '../utils/durationDisplay.js'
import { fetchPublicIp } from '../services/sheetClickIpTrack.js'

const route = useRoute()
const router = useRouter()

/** Sheet catalog only (name, paid, coming soon) — not used for the video list. */
const sheetPlaylist = computed(() => getPlaylistById(String(route.params.id ?? '')))

/** Full JSON from Apps Script (e.g. `{ success, videos }`). */
const remotePlaylistDetail = ref(null)
const loading = ref(true)

const playlistPageLoading = computed(() => playlistsSheetState.loading || loading.value)

const routeId = computed(() => String(route.params.id ?? '').trim())

const apiVideos = computed(() => {
  const d = remotePlaylistDetail.value
  if (!d || typeof d !== 'object') return []
  const arr = Array.isArray(d.videos) ? d.videos : []
  return normalizeVideosFromAppsScript(arr)
})

const displayTitle = computed(() => {
  const n = String(sheetPlaylist.value?.name ?? '').trim()
  if (n) return n
  return routeId.value ? `Playlist ${routeId.value}` : 'Playlist'
})

const showShell = computed(
  () =>
    Boolean(routeId.value) &&
    (Boolean(sheetPlaylist.value) ||
      apiVideos.value.length > 0 ||
      loading.value ||
      playlistsSheetState.loading),
)

const showEmpty = computed(
  () =>
    Boolean(routeId.value) &&
    !loading.value &&
    !playlistsSheetState.loading &&
    !sheetPlaylist.value &&
    apiVideos.value.length === 0,
)

function sheetTruthy(v) {
  return v === true || String(v ?? '').trim().toUpperCase() === 'TRUE'
}

function normalizeVideoFromAppsScript(v) {
  if (!v || typeof v !== 'object') return null
  const id = String(v.id ?? v.videoId ?? '').trim()
  if (!id) return null
  const ytId = String(v.youtubeVideoId ?? v.youtubeId ?? '').trim()
  const link = String(v.youtubeVideoLink ?? '').trim()
  const youtubeVideoLink =
    link || (ytId ? `https://www.youtube.com/watch?v=${encodeURIComponent(ytId)}` : '')
  const thumbRaw = v.thumbnailUrl ?? v.thumbnail
  const thumbnailUrl =
    thumbRaw == null || thumbRaw === '' ? '' : String(thumbRaw).trim()
  return {
    id,
    title: String(v.title ?? '').trim(),
    videoSrc: String(v.videoSrc ?? '').trim(),
    youtubeVideoId: ytId,
    youtubeVideoLink,
    thumbnailUrl,
    duration: formatVideoDurationDisplay(v.duration),
    channelLine: String(v.channelLine ?? 'SagiDeep').trim() || 'SagiDeep',
    isVideoComingSoon: sheetTruthy(v.isVideoComingSoon),
  }
}

function normalizeVideosFromAppsScript(videos) {
  if (!Array.isArray(videos)) return []
  return videos.map(normalizeVideoFromAppsScript).filter(Boolean)
}

function lastHeroThumbFromVideos(videos) {
  if (!Array.isArray(videos)) return ''
  for (let i = videos.length - 1; i >= 0; i--) {
    const u = String(videos[i]?.thumbnailUrl || '').trim()
    if (u) return u
  }
  return ''
}

const heroCoverSrc = computed(() => {
  if (sheetPlaylist.value?.isComingSoon) return ''
  const fromApi = lastHeroThumbFromVideos(apiVideos.value)
  if (fromApi) return fromApi
  const p = sheetPlaylist.value
  if (p) return playlistListCoverImg(p)
  return ''
})

onBeforeMount(async () => {
  const url = SAGIDEEP_TRACKING_URL()
  if (!url) {
    return
  }
  try {
    const ip = await fetchPublicIp();
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      body: JSON.stringify({
        ipAddress: ip,
        activity: 'viewed_playlist',
      }),
    })
    // const data = await response.json()
    console.log(response)
  } catch (error) {
    console.error(error)
  }
})

async function loadPlaylistVideosFromScript() {
  const id = routeId.value
  if (!id) {
    loading.value = false
    return
  }
  const url = SAGIDEEP_PLAYLISTS_URL()
  if (!url) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'doGetVideosByPlaylistId',
        playlistId: id,
      }),
    })
    const text = await response.text()
    const trimmed = text.trimStart()
    if (!response.ok || trimmed.startsWith('<')) {
      return
    }
    remotePlaylistDetail.value = JSON.parse(trimmed)
  } catch (error) {
    console.error('Error fetching videos:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadPlaylistVideosFromScript()
})

watch(
  () => routeId.value,
  (id) => {
    remotePlaylistDetail.value = null
    if (id) void loadPlaylistVideosFromScript()
  },
)

const premiumChipText = computed(() => premiumThumbChip(sheetPlaylist.value?.amount))
const premiumPriceShort = computed(() => premiumPriceCompact(sheetPlaylist.value?.amount))

const premiumUnlocked = ref(false)
watch(
  () => [
    routeId.value,
    Boolean(sheetPlaylist.value?.isPaid),
    Boolean(sheetPlaylist.value?.isComingSoon),
  ],
  ([id, paid, soon]) => {
    if (!id || !paid || soon) {
      premiumUnlocked.value = false
      return
    }
    premiumUnlocked.value = isPremiumPlaylistUnlocked(id)
  },
  { immediate: true },
)

const playlistPremiumLocked = computed(
  () =>
    Boolean(sheetPlaylist.value?.isPaid) &&
    !sheetPlaylist.value?.isComingSoon &&
    !premiumUnlocked.value,
)

function onUnlockPlaylist() {
  const id = routeId.value
  if (!id || !sheetPlaylist.value?.isPaid) return
  unlockPremiumPlaylist(id)
  premiumUnlocked.value = true
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'home' })
}
</script>



<style scoped>
.shell {
  position: relative;
  min-height: 100%;
  padding: 10px 16px max(28px, env(safe-area-inset-bottom));
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
  background: radial-gradient(ellipse 120% 80% at 50% -20%, rgba(154, 27, 47, 0.14), transparent 55%),
    linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 50%, #0c0c0c 100%);
  color: #e8e4dc;
}

.shell__glow {
  pointer-events: none;
  position: fixed;
  inset: 0;
  max-width: 480px;
  margin: 0 auto;
  background: radial-gradient(circle at 80% 15%, rgba(201, 162, 39, 0.05), transparent 42%),
    radial-gradient(circle at 12% 55%, rgba(154, 27, 47, 0.06), transparent 38%);
  z-index: 0;
}

.shell--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.top__back {
  border: none;
  background: transparent;
  color: #f1f1f1;
  font-size: 16px;
  font-weight: 600;
  padding: 8px 4px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.top__back:focus-visible {
  outline: 2px solid rgba(201, 162, 39, 0.55);
  border-radius: 6px;
}

.head {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 14px;
  margin-bottom: 24px;
}

.head__thumb-wrap {
  position: relative;
  flex-shrink: 0;
  width: 120px;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  background: #1a1a1a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
}

.head__thumb {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.head__thumb--placeholder {
  background: #222;
}

.head__premium-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 3;
  max-width: calc(100% - 10px);
  padding: 3px 7px;
  border-radius: 6px;
  pointer-events: none;
  background: rgba(8, 8, 10, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.head__premium-chip {
  display: block;
  font-size: 8.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
  line-height: 1.35;
  color: rgba(245, 240, 230, 0.94);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.head__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.head__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
  color: #fff;
}

.head__premium-note {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #9a948a;
}

.head__unlock-btn {
  margin-top: 10px;
  align-self: flex-start;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(201, 162, 39, 0.45);
  background: linear-gradient(180deg, rgba(201, 162, 39, 0.18), rgba(201, 162, 39, 0.06));
  color: #f5ecd4;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.head__unlock-btn:active {
  background: rgba(201, 162, 39, 0.22);
}

.head__unlock-btn:focus-visible {
  outline: 2px solid rgba(201, 162, 39, 0.55);
  outline-offset: 2px;
}

.head__meta {
  margin: 0;
  font-size: 13px;
  color: #aaa;
}

.list {
  position: relative;
  z-index: 1;
}

.list__label {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #f1f1f1;
}

.list__ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.empty__text {
  margin: 0;
  color: #aaa;
}

.empty__link {
  color: #3ea6ff;
  font-weight: 600;
  text-decoration: none;
}

.head--paid {
  align-items: center;
}

.head--soon {
  align-items: center;
}

.head--soon .head__thumb-wrap {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 4px 22px rgba(0, 0, 0, 0.42);
}

.head__thumb--soon-ph {
  background: linear-gradient(165deg, #252326 0%, #161418 50%, #101012 100%);
}

.head__soon-veil {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.2) 100%);
}

.head__soon-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 84px;
  padding: 10px 13px;
  border-radius: 11px;
  color: rgba(248, 246, 242, 0.96);
  background: rgba(22, 21, 24, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 0 0 1px rgba(201, 162, 39, 0.12),
    0 10px 28px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.head__soon-chip-line {
  display: block;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  line-height: 1.2;
}

.head__soon-chip-line + .head__soon-chip-line {
  margin-top: 2px;
  font-size: 8.5px;
  letter-spacing: 0.26em;
  opacity: 0.82;
}

.head--soon .head__meta {
  color: #b8a990;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.soon {
  position: relative;
  z-index: 1;
  margin-top: 8px;
}

.soon__card {
  padding: 20px 18px 22px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: linear-gradient(165deg, rgba(34, 32, 36, 0.75), rgba(16, 15, 18, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 10px 32px rgba(0, 0, 0, 0.38);
}

.soon__title {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #ebe6dc;
}

.soon__copy {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #9c968a;
}

.soon__paid-hint {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #c9a227;
  letter-spacing: 0.02em;
}
</style>

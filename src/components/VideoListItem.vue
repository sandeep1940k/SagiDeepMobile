<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { isMegaFileOrEmbedUrl, isMegaNonImagePageUrl, megaFileEmbedForThumbnail } from '../utils/megaVideo.js'
import { episodeYoutubeVideoId } from '../utils/youtubeVideoId.js'

const props = defineProps({
  playlistId: { type: String, required: true },
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  /** Direct image URL or MEGA `file` / `embed` link (MEGA embed iframe in thumb) */
  thumbnailUrl: { type: String, default: '' },
  /** With `youtubeVideoLink`, used for `i.ytimg.com` when raster thumb is missing or errors */
  youtubeVideoId: { type: String, default: '' },
  youtubeVideoLink: { type: String, default: '' },
  channelLine: { type: String, default: 'SagiDeep' },
  duration: { type: String, default: '' },
  isVideoComingSoon: { type: Boolean, default: false },
  /** Paid playlist not yet unlocked — no play / no navigation (same gating as player). */
  playlistPremiumLocked: { type: Boolean, default: false },
})

const router = useRouter()

const thumbRasterFailed = ref(false)
const thumbYtFailed = ref(false)
watch(
  () => [props.thumbnailUrl, props.youtubeVideoId, props.youtubeVideoLink],
  () => {
    thumbRasterFailed.value = false
    thumbYtFailed.value = false
  },
)

const youtubeThumbUrl = computed(() => {
  const id = episodeYoutubeVideoId({
    youtubeVideoId: props.youtubeVideoId,
    youtubeVideoLink: props.youtubeVideoLink,
  })
  if (!id) return ''
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`
})

const megaThumbEmbedSrc = computed(() => megaFileEmbedForThumbnail(props.thumbnailUrl))

const showThumbRaster = computed(() => {
  const src = String(props.thumbnailUrl || '').trim()
  if (!src) return false
  if (megaThumbEmbedSrc.value) return false
  if (isMegaNonImagePageUrl(src) && !isMegaFileOrEmbedUrl(src)) return false
  return !thumbRasterFailed.value
})

function onThumbRasterError() {
  thumbRasterFailed.value = true
}

const showYoutubeThumb = computed(() => {
  if (megaThumbEmbedSrc.value) return false
  if (showThumbRaster.value) return false
  if (!youtubeThumbUrl.value) return false
  return !thumbYtFailed.value
})

function onThumbYtError() {
  thumbYtFailed.value = true
}

const blockedPlay = computed(() => props.isVideoComingSoon || props.playlistPremiumLocked)

const metaLine = computed(() => {
  if (props.isVideoComingSoon) return 'Coming soon'
  if (props.playlistPremiumLocked) return 'Unlock to watch'
  return props.channelLine
})

function goWatch() {
  if (blockedPlay.value) return
  router.push({
    name: 'watch',
    params: { playlistId: props.playlistId, videoId: props.videoId },
  })
}

function onKeydown(e) {
  if (blockedPlay.value) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    goWatch()
  }
}
</script>

<template>
  <div
    class="yt-video"
    :class="{ 'yt-video--soon': isVideoComingSoon, 'yt-video--premium-lock': playlistPremiumLocked }"
    :role="blockedPlay ? 'group' : 'link'"
    :tabindex="blockedPlay ? -1 : 0"
    :aria-disabled="blockedPlay || undefined"
    :aria-label="
      isVideoComingSoon ? `${title} (coming soon)` : playlistPremiumLocked ? `${title} (premium)` : title
    "
    @click="goWatch"
    @keydown="onKeydown"
  >
    <div class="yt-video__thumb">
      <iframe
        v-if="megaThumbEmbedSrc"
        :src="megaThumbEmbedSrc"
        class="yt-video__img yt-video__mega-iframe"
        :title="`${title} thumbnail`"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerpolicy="strict-origin-when-cross-origin"
      />
      <img
        v-else-if="showThumbRaster"
        :src="thumbnailUrl"
        class="yt-video__img"
        :alt="title"
        loading="lazy"
        decoding="async"
        @error="onThumbRasterError"
      />
      <img
        v-else-if="showYoutubeThumb"
        :src="youtubeThumbUrl"
        class="yt-video__img"
        :alt="title"
        loading="lazy"
        decoding="async"
        @error="onThumbYtError"
      />
      <div v-else class="yt-video__placeholder" aria-hidden="true">
        <svg class="yt-video__ph-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <div v-if="isVideoComingSoon || playlistPremiumLocked" class="yt-video__veil" aria-hidden="true" />
      <div v-if="isVideoComingSoon" class="yt-video__soon-badge" role="status">
        <span class="yt-video__soon-line">Coming</span>
        <span class="yt-video__soon-line">soon</span>
      </div>
      <div v-else-if="playlistPremiumLocked" class="yt-video__premium-badge" role="status">
        <span class="yt-video__premium-line">Premium</span>
        <span class="yt-video__premium-line yt-video__premium-line--sub">Locked</span>
      </div>
      <span v-if="duration" class="yt-video__duration">{{ duration }}</span>
      <span v-if="!blockedPlay" class="yt-video__play-badge" aria-hidden="true">
        <svg class="yt-video__play-ic" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </div>

    <div class="yt-video__info">
      <span class="yt-video__title">{{ title }}</span>
      <span
        class="yt-video__meta"
        :class="{
          'yt-video__meta--soon': isVideoComingSoon,
          'yt-video__meta--premium': playlistPremiumLocked,
        }"
        >{{ metaLine }}</span
      >
    </div>
  </div>
</template>

<style scoped>
.yt-video {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  -webkit-tap-highlight-color: transparent;
}

.yt-video:not(.yt-video--soon):not(.yt-video--premium-lock) {
  cursor: pointer;
}

.yt-video--soon,
.yt-video--premium-lock {
  cursor: default;
  opacity: 0.92;
}

.yt-video:last-of-type {
  border-bottom: none;
}

.yt-video:not(.yt-video--soon):not(.yt-video--premium-lock):active {
  background: rgba(255, 255, 255, 0.04);
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 8px;
}

.yt-video:focus-visible {
  outline: 2px solid rgba(62, 166, 255, 0.45);
  outline-offset: 2px;
  border-radius: 8px;
}

.yt-video--soon:focus-visible,
.yt-video--premium-lock:focus-visible {
  outline: none;
}

.yt-video__thumb {
  flex-shrink: 0;
  position: relative;
  width: 140px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a1a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.yt-video--soon .yt-video__thumb,
.yt-video--premium-lock .yt-video__thumb {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.yt-video__img {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.yt-video--soon .yt-video__img,
.yt-video--soon .yt-video__mega-iframe,
.yt-video--premium-lock .yt-video__img,
.yt-video--premium-lock .yt-video__mega-iframe {
  filter: brightness(0.9) saturate(0.88);
}

.yt-video__mega-iframe {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  border: 0;
  pointer-events: none;
  background: #0a0a0a;
}

.yt-video__placeholder {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #2a2228, #141218);
  color: rgba(255, 255, 255, 0.25);
}

.yt-video__ph-icon {
  width: 36px;
  height: 36px;
}

.yt-video__veil {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.22) 100%);
}

.yt-video__soon-badge {
  position: absolute;
  z-index: 3;
  right: 50%;
  bottom: 50%;
  transform: translate(50%, 50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-width: 72px;
  padding: 7px 10px;
  border-radius: 9px;
  pointer-events: none;
  color: rgba(248, 246, 242, 0.96);
  background: rgba(22, 21, 24, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 0 0 1px rgba(201, 162, 39, 0.12),
    0 8px 20px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.yt-video__soon-line {
  display: block;
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  line-height: 1.15;
}

.yt-video__soon-line + .yt-video__soon-line {
  margin-top: 2px;
  font-size: 8px;
  letter-spacing: 0.22em;
  opacity: 0.82;
}

.yt-video__premium-badge {
  position: absolute;
  z-index: 3;
  right: 50%;
  bottom: 50%;
  transform: translate(50%, 50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-width: 72px;
  padding: 7px 10px;
  border-radius: 9px;
  pointer-events: none;
  color: rgba(252, 245, 232, 0.96);
  background: rgba(32, 26, 18, 0.88);
  border: 1px solid rgba(201, 162, 39, 0.35);
  box-shadow:
    0 0 0 1px rgba(201, 162, 39, 0.15),
    0 8px 20px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.yt-video__premium-line {
  display: block;
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1.15;
}

.yt-video__premium-line--sub {
  margin-top: 2px;
  font-size: 8px;
  letter-spacing: 0.2em;
  opacity: 0.88;
}

.yt-video__duration {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #fff;
  background: rgba(0, 0, 0, 0.85);
  line-height: 1.35;
  z-index: 1;
}

.yt-video__play-badge {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  opacity: 0.85;
  pointer-events: none;
}

.yt-video__play-ic {
  width: 44px;
  height: 44px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
}

.yt-video__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
}

.yt-video__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  color: #f1f1f1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.yt-video--soon .yt-video__title,
.yt-video--premium-lock .yt-video__title {
  color: #c8c4bc;
}

.yt-video__meta {
  font-size: 12px;
  color: #aaa;
  line-height: 1.3;
}

.yt-video__meta--soon {
  font-weight: 500;
  letter-spacing: 0.03em;
  color: #b8a990;
}

.yt-video__meta--premium {
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #c9a227;
}
</style>

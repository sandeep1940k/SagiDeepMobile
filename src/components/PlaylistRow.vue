<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  playlistId: { type: String, required: true },
  title: { type: String, required: true },
  videoCount: { type: Number, required: true },
  /** Public URL or /path from Vite public/ — when set, replaces the 4-up placeholder grid */
  coverSrc: { type: String, default: '' },
  variant: {
    type: String,
    default: 'blood',
    validator: (v) => ['blood', 'gold', 'ash'].includes(v),
  },
  comingSoon: { type: Boolean, default: false },
})
</script>

<template>
  <div class="yt-row" :class="{ 'yt-row--soon': comingSoon }">
    <RouterLink :to="{ name: 'playlist', params: { id: playlistId } }" class="yt-row__main">
      <div class="yt-thumb" :class="{ 'yt-thumb--soon': comingSoon }" :data-variant="variant" aria-hidden="true">
        <img
          v-if="coverSrc"
          :src="coverSrc"
          class="yt-thumb__cover"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <div v-else class="yt-thumb__grid">
          <span class="yt-thumb__cell yt-thumb__cell--1" />
          <span class="yt-thumb__cell yt-thumb__cell--2" />
          <span class="yt-thumb__cell yt-thumb__cell--3" />
          <span class="yt-thumb__cell yt-thumb__cell--4" />
        </div>
        <div v-if="comingSoon" class="yt-thumb__veil" />
        <div v-if="comingSoon" class="yt-thumb__badge yt-thumb__badge--soon" role="status">
          <span class="yt-thumb__soon-line">Coming</span>
          <span class="yt-thumb__soon-line">soon</span>
        </div>
        <div v-else class="yt-thumb__badge">
          <svg class="yt-thumb__play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>{{ videoCount }} videos</span>
        </div>
      </div>

      <div class="yt-row__text">
        <span class="yt-row__title">{{ title }}</span>
        <span v-if="comingSoon" class="yt-row__meta yt-row__meta--soon">Coming soon</span>
        <span v-else class="yt-row__meta">Playlist · Public</span>
      </div>
    </RouterLink>
  </div>
</template>

<style scoped>
.yt-row {
  display: flex;
  align-items: stretch;
  gap: 0;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.15s ease;
}

.yt-row:active {
  background: rgba(255, 255, 255, 0.06);
}

.yt-row--soon {
  background: rgba(255, 255, 255, 0.028);
  border: 1px solid rgba(255, 255, 255, 0.055);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
}

.yt-row--soon:active {
  background: rgba(255, 255, 255, 0.045);
}

.yt-row--soon .yt-row__main {
  align-items: center;
}

.yt-row--soon .yt-row__text {
  padding-top: 0;
  justify-content: center;
  min-height: 68px;
}

.yt-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px 10px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: inherit;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.yt-row__main:focus-visible {
  outline: 2px solid rgba(201, 162, 39, 0.6);
  outline-offset: 2px;
  border-radius: 8px;
}

/* —— Thumbnail (YouTube-style 4-up grid) —— */
.yt-thumb {
  flex-shrink: 0;
  position: relative;
  width: 120px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a1a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.yt-thumb__cover {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.yt-thumb__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  background: rgba(0, 0, 0, 0.45);
}

.yt-thumb__cell {
  display: block;
  min-height: 0;
}

.yt-thumb[data-variant='blood'] .yt-thumb__cell--1 {
  background: linear-gradient(145deg, #5c1a28, #2a0f14);
}
.yt-thumb[data-variant='blood'] .yt-thumb__cell--2 {
  background: linear-gradient(145deg, #3d1620, #1a0a10);
}
.yt-thumb[data-variant='blood'] .yt-thumb__cell--3 {
  background: linear-gradient(145deg, #4a1522, #221018);
}
.yt-thumb[data-variant='blood'] .yt-thumb__cell--4 {
  background: linear-gradient(145deg, #6b2030, #2d1218);
}

.yt-thumb[data-variant='gold'] .yt-thumb__cell--1 {
  background: linear-gradient(145deg, #5c4a1a, #2e2410);
}
.yt-thumb[data-variant='gold'] .yt-thumb__cell--2 {
  background: linear-gradient(145deg, #4a3d18, #252010);
}
.yt-thumb[data-variant='gold'] .yt-thumb__cell--3 {
  background: linear-gradient(145deg, #6b5a22, #322a12);
}
.yt-thumb[data-variant='gold'] .yt-thumb__cell--4 {
  background: linear-gradient(145deg, #3d3514, #1f1a0a);
}

.yt-thumb[data-variant='ash'] .yt-thumb__cell--1 {
  background: linear-gradient(145deg, #3d4550, #1e2328);
}
.yt-thumb[data-variant='ash'] .yt-thumb__cell--2 {
  background: linear-gradient(145deg, #2e343c, #181c22);
}
.yt-thumb[data-variant='ash'] .yt-thumb__cell--3 {
  background: linear-gradient(145deg, #454e5a, #252b32);
}
.yt-thumb[data-variant='ash'] .yt-thumb__cell--4 {
  background: linear-gradient(145deg, #323940, #1a1e24);
}

.yt-thumb--soon {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 2px 16px rgba(0, 0, 0, 0.38);
  background: linear-gradient(165deg, #252326 0%, #151418 48%, #101012 100%);
}

.yt-thumb--soon .yt-thumb__cover,
.yt-thumb--soon .yt-thumb__grid {
  filter: brightness(0.94) saturate(0.88);
}

.yt-thumb__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.22) 100%);
}

.yt-thumb__badge {
  position: absolute;
  z-index: 2;
  right: 4px;
  bottom: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #fff;
  background: rgba(0, 0, 0, 0.82);
  line-height: 1.2;
}

.yt-thumb__badge--soon {
  right: 50%;
  bottom: 50%;
  transform: translate(50%, 50%);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-width: 76px;
  padding: 9px 11px;
  border-radius: 10px;
  font-size: 0;
  line-height: 1;
  letter-spacing: 0;
  text-transform: none;
  color: rgba(248, 246, 242, 0.96);
  background: rgba(22, 21, 24, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 0 0 1px rgba(201, 162, 39, 0.12),
    0 10px 26px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.yt-thumb__soon-line {
  display: block;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  line-height: 1.2;
}

.yt-thumb__soon-line + .yt-thumb__soon-line {
  margin-top: 3px;
  font-size: 8.5px;
  letter-spacing: 0.26em;
  opacity: 0.82;
}

.yt-thumb__play {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.95;
}

/* —— Text column —— */
.yt-row__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 2px;
}

.yt-row__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  color: #f1f1f1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.yt-row__meta {
  font-size: 13px;
  color: #aaa;
  line-height: 1.3;
}

.yt-row__meta--soon {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: #b8a990;
}

</style>

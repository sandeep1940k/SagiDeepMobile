<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getPlaylistById } from '../data/playlists'
import VideoListItem from '../components/VideoListItem.vue'

const route = useRoute()
const router = useRouter()

const playlist = computed(() => getPlaylistById(route.params.id))

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <div v-if="playlist" class="shell">
    <div class="shell__glow" aria-hidden="true" />

    <header class="top">
      <button type="button" class="top__back" @click="goBack">‹ Back</button>
    </header>

    <div class="head">
      <div class="head__thumb-wrap">
        <img
          v-if="playlist.coverSrc"
          :src="playlist.coverSrc"
          class="head__thumb"
          :alt="playlist.name"
          loading="lazy"
        />
        <div v-else class="head__thumb head__thumb--placeholder" />
      </div>
      <div class="head__text">
        <h1 class="head__title">{{ playlist.name }}</h1>
        <p class="head__meta">{{ playlist.videos.length }} videos · Playlist</p>
      </div>
    </div>

    <section class="list" aria-label="Videos in playlist">
      <h2 class="list__label">Videos</h2>
      <ul class="list__ul">
        <li v-for="v in playlist.videos" :key="v.id">
          <VideoListItem
            :playlist-id="String(route.params.id)"
            :video-id="v.id"
            :title="v.title"
            :thumbnail-url="v.thumbnailUrl || ''"
            :channel-line="v.channelLine || 'SagiDeep'"
            :duration="v.duration || ''"
          />
        </li>
      </ul>
    </section>
  </div>

  <div v-else class="shell shell--empty">
    <p class="empty__text">Playlist not found.</p>
    <RouterLink :to="{ name: 'home' }" class="empty__link">Go home</RouterLink>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100%;
  min-height: 100dvh;
  padding: max(12px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom));
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
  flex-shrink: 0;
  width: 120px;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
}

.head__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

.head__thumb--placeholder {
  background: #222;
}

.head__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.head__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
  color: #fff;
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
</style>

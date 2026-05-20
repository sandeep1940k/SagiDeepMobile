<template>
  <div class="shell">
    <div class="shell__glow" aria-hidden="true" />

    <section class="vault" aria-label="Playlists">
      <template v-if="showSkeleton">
        <PageSkeleton variant="list" :rows="7" />
      </template>
      <template v-else-if="playlistApiState.error">
        <p class="vault__error">{{ playlistApiState.error }}</p>
        <button type="button" class="vault__retry" @click="reload">Try again</button>
      </template>
      <template v-else>
        <div class="vault__head">
          <h2 class="vault__label">Playlists</h2>
          <span class="vault__count">{{
            playlistsIndex.length === 1 ? '1 list' : `${playlistsIndex.length} lists`
          }}</span>
        </div>
        <ul class="vault__list">
          <li v-for="p in playlistsIndex" :key="p.id" class="vault__item">
            <PlaylistRow
              :playlist-id="p.id"
              :title="p.name"
              :video-count="p.videoCount"
              :variant="p.variant"
              :cover-src="p.listCoverImg"
              :coming-soon="p.isComingSoon"
              :is-paid="p.isPaid"
              :paid-amount="p.amount"
            />
          </li>
        </ul>
      </template>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue'
import PageSkeleton from '../components/PageSkeleton.vue'
import PlaylistRow from '../components/PlaylistRow.vue'
import {
  loadPlaylistsFromApi,
  playlistApiState,
  playlistsIndex,
} from '../services/playlistApi.js'
import { SAGIDEEP_TRACKING_URL } from '../services/userAuth.js'
import { fetchPublicIp } from '../services/sheetClickIpTrack.js'
import { postAppsScriptJson } from '../utils/appsScriptFetch.js'

const showSkeleton = computed(() => playlistApiState.loading)

function reload() {
  void loadPlaylistsFromApi()
}

onBeforeMount(async () => {
  const url = SAGIDEEP_TRACKING_URL()
  if (!url) return
  try {
    const ip = await fetchPublicIp()
    await postAppsScriptJson(url, {
      ipAddress: ip,
      activity: 'viewed_home',
    })
  } catch {
    /* tracking is best-effort */
  }
})
</script>

<style scoped>
.shell {
  position: relative;
  min-height: 100%;
  padding: 12px 16px max(28px, env(safe-area-inset-bottom));
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

.vault {
  position: relative;
  z-index: 1;
}

.vault__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.vault__label {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #f1f1f1;
}

.vault__count {
  font-size: 13px;
  color: #aaa;
  font-variant-numeric: tabular-nums;
}

.vault__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vault__item {
  margin: 0;
}

.vault__error {
  margin: 0 0 12px;
  color: #f87171;
  font-size: 14px;
}

.vault__retry {
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #eee;
  cursor: pointer;
}
</style>

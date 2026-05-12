<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import ChannelSubscribeToast from './components/ChannelSubscribeToast.vue'
import GlobalAppHeader from './components/GlobalAppHeader.vue'
import GlobalFooter from './components/GlobalFooter.vue'

const route = useRoute()
/** Account bar + channel promo; hidden on full-screen watch and on auth. */
const showGlobalChrome = computed(() => route.name !== 'watch' && route.name !== 'auth')
const showGlobalFooter = computed(() => showGlobalChrome.value)
</script>

<template>
  <div class="app-layout">
    <GlobalAppHeader v-if="showGlobalChrome" />
    <ChannelSubscribeToast v-if="showGlobalChrome" />
    <main class="app-layout__main">
      <RouterView />
    </main>
    <GlobalFooter v-if="showGlobalFooter" />
  </div>
</template>

<style scoped>
.app-layout {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-layout__main {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>

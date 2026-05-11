<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import GlobalFooter from './components/GlobalFooter.vue'

const route = useRoute()
const showGlobalFooter = computed(() => route.name !== 'watch')
</script>

<template>
  <div class="app-layout">
    <main class="app-layout__main">
      <RouterView />
    </main>
    <GlobalFooter v-if="showGlobalFooter" />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.app-layout__main {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
}
</style>

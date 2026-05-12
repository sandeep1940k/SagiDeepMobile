<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GlobalAccountBar from './GlobalAccountBar.vue'
import { clearStoredSession, getStoredSession } from '../services/userAuth.js'

const route = useRoute()
const account = ref(getStoredSession())

function refreshAccount() {
  account.value = getStoredSession()
}

onMounted(refreshAccount)
watch(() => route.fullPath, refreshAccount)

function onPromoLogout() {
  clearStoredSession()
  refreshAccount()
}

/** Plain object for child props (avoids edge cases where a Ref is treated as a signed-in session). */
const accountSession = computed(() => account.value)
</script>

<template>
  <header class="global-app-header" aria-label="App header and channel">
    <div class="global-app-header__stack">
      <GlobalAccountBar :session="accountSession" @logout="onPromoLogout" />
    </div>
  </header>
</template>

<style scoped>
.global-app-header {
  flex-shrink: 0;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
  padding: max(10px, env(safe-area-inset-top)) 16px 12px;
  z-index: 40;
  background: linear-gradient(
    180deg,
    rgba(10, 10, 10, 0.98) 0%,
    rgba(14, 14, 14, 0.96) 70%,
    rgba(14, 14, 14, 0.88) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.global-app-header__stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>

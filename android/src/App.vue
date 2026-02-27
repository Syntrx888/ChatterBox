<template>
  <div id="app" class="min-h-screen">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import config from './config'

onMounted(() => {
  document.title = config.chatRoomName
  
  const favicon = document.getElementById('favicon')
  if (config.faviconUrl) {
    favicon.href = config.faviconUrl
  }
})
</script>

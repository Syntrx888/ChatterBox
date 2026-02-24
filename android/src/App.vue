<template>
  <div id="app" class="min-h-screen">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { LocalNotifications } from '@capacitor/local-notifications'
import config from './config'

onMounted(async () => {
  document.title = config.chatRoomName
  
  const favicon = document.getElementById('favicon')
  if (config.faviconUrl) {
    favicon.href = config.faviconUrl
  }

  try {
    const result = await LocalNotifications.checkPermissions()
    if (result.display !== 'granted') {
      await LocalNotifications.requestPermissions()
    }
  } catch (error) {
    console.error('通知权限请求失败:', error)
  }
})
</script>

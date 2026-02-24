<template>
  <div class="min-h-screen bg-syntrx-50 flex items-center justify-center">
    <div class="text-center">
      <div class="flex justify-center mb-8">
        <div class="flex space-x-2">
          <div class="w-4 h-4 bg-syntrx-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
          <div class="w-4 h-4 bg-syntrx-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="w-4 h-4 bg-syntrx-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
      </div>
      <h2 class="text-xl text-syntrx-600">正在连接服务器...</h2>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { isAuthenticated, verifyToken } = useAuth()

onMounted(async () => {
  if (isAuthenticated.value) {
    const isValid = await verifyToken()
    if (isValid) {
      router.push('/chat')
    } else {
      router.push('/auth')
    }
  } else {
    router.push('/auth')
  }
})
</script>

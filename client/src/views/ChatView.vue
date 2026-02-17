<template>
  <div class="min-h-screen bg-syntrx-50 flex flex-col">
    <header class="glass fixed top-0 left-0 right-0 z-10 border-b border-syntrx-200">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-syntrx-200 shadow-sm">
            <img :src="config.faviconUrl || defaultPlaceholder" class="w-full h-full object-cover" alt="网站图标" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-syntrx-800">{{ config.chatRoomName }}</h1>
            <div class="text-xs text-syntrx-400 mt-0.5">
              Powered by <a href="https://github.com/Syntrx888/ChatterBox" target="_blank" rel="noopener noreferrer" class="text-syntrx-400 hover:text-syntrx-500 underline decoration-dotted underline-offset-2">ChatterBox</a>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <router-link
            to="/members"
            class="px-4 py-2 bg-syntrx-100 hover:bg-syntrx-200 text-syntrx-700 rounded-lg transition-colors"
          >
            成员
          </router-link>
          <router-link
            to="/settings"
            class="px-4 py-2 bg-syntrx-100 hover:bg-syntrx-200 text-syntrx-700 rounded-lg transition-colors"
          >
            设置
          </router-link>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto pt-20 pb-32 px-4">
      <div class="max-w-2xl mx-auto space-y-6">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="[
            'flex gap-3',
            message.username === username ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            v-if="message.username !== username"
            class="flex-shrink-0"
          >
            <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-syntrx-200 shadow-sm">
              <img :src="message.avatar || config.defaultAvatar || defaultPlaceholder" class="w-full h-full object-cover" alt="头像" />
            </div>
          </div>
          <div
            :class="[
              'max-w-[70%] p-4 rounded-2xl shadow-sm transition-all',
              message.username === username
                ? 'bg-syntrx-100 text-syntrx-900'
                : 'bg-white text-gray-800'
            ]"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-syntrx-700">{{ message.username }}</span>
              <span class="text-xs text-gray-500">{{ formatTime(message.created_at) }}</span>
            </div>
            <div class="prose prose-sm max-w-none break-words whitespace-pre-wrap overflow-wrap-anywhere">
              <template v-for="(part, index) in formatMessage(message.content)" :key="index">
                <span v-if="part.type === 'text'">{{ part.content }}</span>
                <img v-else-if="part.type === 'image'" :src="part.url" class="max-w-full max-h-64 w-auto h-auto rounded-lg mt-2 object-contain" alt="图片" />
              </template>
            </div>
          </div>
          <div
            v-if="message.username === username"
            class="flex-shrink-0"
          >
            <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-syntrx-200 shadow-sm">
              <img :src="message.avatar || config.defaultAvatar || defaultPlaceholder" class="w-full h-full object-cover" alt="头像" />
            </div>
          </div>
        </div>

        <div v-if="messages.length === 0" class="text-center text-gray-500 py-12">
          暂无消息，开始聊天吧！
        </div>
      </div>
    </main>

    <footer class="glass fixed bottom-0 left-0 right-0 border-t border-syntrx-200">
      <div class="max-w-2xl mx-auto p-4">
        <form @submit.prevent="handleSendMessage" class="flex gap-3">
          <textarea
            v-model="inputMessage"
            @keydown.enter.prevent="handleEnterKey"
            placeholder="输入消息..."
            rows="1"
            class="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none resize-none transition-all"
          />
          <button
            type="submit"
            :disabled="!inputMessage.trim() || !connected"
            class="px-6 py-3 bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-all"
          >
            发送
          </button>
        </form>
        <div v-if="!connected" class="text-center text-sm text-red-500 mt-2">
          连接断开，正在重新连接...
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, useSocket } from '../composables/useAuth'
import config from '../config'

const router = useRouter()
const { username, avatar } = useAuth()
const { connect, disconnect, connected, messages, sendMessage } = useSocket()

const inputMessage = ref('')
const defaultPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23E5E7EB"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-size="40" fill="%239CA3AF"%3E?%3C/text%3E%3C/svg%3E'

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const formatMessage = (content) => {
  const parts = []
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi
  let lastIndex = 0
  let match

  while ((match = urlRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }
    parts.push({
      type: 'image',
      url: match[0]
    })
    lastIndex = urlRegex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }

  return parts
}

const handleSendMessage = () => {
  if (inputMessage.value.trim() && connected.value) {
    sendMessage(inputMessage.value.trim())
    inputMessage.value = ''
  }
}

const handleEnterKey = (e) => {
  if (!e.shiftKey) {
    handleSendMessage()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  })
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    connect(token)
  }
})

onUnmounted(() => {
  disconnect()
})
</script>

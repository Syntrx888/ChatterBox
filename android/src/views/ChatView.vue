<template>
  <div class="min-h-screen bg-syntrx-50 flex flex-col">
    <header class="glass fixed top-0 left-0 right-0 z-10 border-b border-syntrx-200">
      <div class="mobile-container py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-syntrx-200 shadow-sm">
            <img :src="config.faviconUrl || defaultPlaceholder" class="w-full h-full object-cover" alt="网站图标" />
          </div>
          <div>
            <h1 class="text-base font-bold text-syntrx-800">{{ config.chatRoomName }}</h1>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <router-link
            to="/members"
            class="px-3 py-1.5 bg-syntrx-100 hover:bg-syntrx-200 text-syntrx-700 rounded-lg text-sm transition-colors"
          >
            成员
          </router-link>
          <router-link
            to="/settings"
            class="px-3 py-1.5 bg-syntrx-100 hover:bg-syntrx-200 text-syntrx-700 rounded-lg text-sm transition-colors"
          >
            设置
          </router-link>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto pt-16 pb-28 px-3">
      <div class="mobile-container space-y-4">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="[
            'flex gap-2',
            message.username === username ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            v-if="message.username !== username"
            class="flex-shrink-0"
          >
            <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-syntrx-200 shadow-sm">
              <img :src="message.avatar || config.defaultAvatar || defaultPlaceholder" class="w-full h-full object-cover" alt="头像" />
            </div>
          </div>
          <div
            :class="[
              'max-w-[75%] p-3 rounded-xl shadow-sm transition-all',
              message.username === username
                ? 'bg-syntrx-100 text-syntrx-900'
                : 'bg-white text-gray-800'
            ]"
          >
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="text-xs font-medium text-syntrx-700">{{ message.username }}</span>
              <span class="text-[10px] text-gray-500">{{ formatTime(message.created_at) }}</span>
            </div>
            <div class="prose prose-xs max-w-none break-words whitespace-pre-wrap overflow-wrap-anywhere">
              <template v-for="(part, index) in formatMessage(message.content)" :key="index">
                <span v-if="part.type === 'text'">{{ part.content }}</span>
                <img v-else-if="part.type === 'image'" :src="part.url" class="max-w-full max-h-48 w-auto h-auto rounded-lg mt-1 object-contain" alt="图片" />
              </template>
            </div>
          </div>
          <div
            v-if="message.username === username"
            class="flex-shrink-0"
          >
            <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-syntrx-200 shadow-sm">
              <img :src="message.avatar || config.defaultAvatar || defaultPlaceholder" class="w-full h-full object-cover" alt="头像" />
            </div>
          </div>
        </div>

        <div v-if="messages.length === 0" class="text-center text-gray-500 py-8 text-sm">
          暂无消息，开始聊天吧！
        </div>
      </div>
    </main>

    <footer class="glass fixed bottom-0 left-0 right-0 border-t border-syntrx-200">
      <div class="mobile-container p-3">
        <form @submit.prevent="handleSendMessage" class="flex gap-2">
          <textarea
            v-model="inputMessage"
            @keydown.enter.prevent="handleEnterKey"
            placeholder="输入消息..."
            rows="1"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none resize-none transition-all text-sm"
          />
          <button
            type="submit"
            :disabled="!inputMessage.trim() || !connected"
            class="px-4 py-2 bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-all text-sm"
          >
            发送
          </button>
        </form>
        <div v-if="!connected" class="text-center text-xs text-red-500 mt-1.5">
          连接断开，正在重新连接...
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { LocalNotifications } from '@capacitor/local-notifications'
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

const showNotification = async (message) => {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: `${message.username} 发来消息`,
          body: message.content,
          largeBody: message.content,
          summaryText: '新消息',
          schedule: { at: new Date() }
        }
      ]
    })
  } catch (error) {
    console.error('通知发送失败:', error)
  }
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

watch(messages, (newMessages) => {
  scrollToBottom()
  
  const lastMessage = newMessages[newMessages.length - 1]
  if (lastMessage && lastMessage.username !== username.value) {
    showNotification(lastMessage)
  }
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

<template>
  <div class="chat-container flex flex-col bg-syntrx-50">
    <header class="glass flex-shrink-0 border-b border-syntrx-200 safe-area-top">
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

    <main class="flex-1 overflow-y-auto px-3 chat-main">
      <div class="mobile-container space-y-4 py-4">
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
            <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-syntrx-200 shadow-sm">
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
            <div class="text-sm max-w-none break-words whitespace-pre-wrap overflow-wrap-anywhere leading-relaxed">
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
            <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-syntrx-200 shadow-sm">
              <img :src="message.avatar || config.defaultAvatar || defaultPlaceholder" class="w-full h-full object-cover" alt="头像" />
            </div>
          </div>
        </div>

        <div v-if="messages.length === 0" class="text-center text-gray-500 py-8 text-sm">
          暂无消息，开始聊天吧！
        </div>
      </div>
    </main>

    <footer class="glass flex-shrink-0 border-t border-syntrx-200 safe-area-bottom pb-safe">
      <div class="mobile-container p-2">
        <form @submit.prevent="handleSendMessage" class="flex gap-2 items-center">
          <input
            v-model="inputMessage"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
            @keydown.enter.prevent="handleEnterKey"
            placeholder="输入消息..."
            type="text"
            inputmode="text"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all text-sm h-10"
          />
          <button
            type="submit"
            :disabled="!inputMessage.trim() || !connected"
            class="px-4 py-2 bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-all text-sm h-10 flex items-center justify-center"
          >
            发送
          </button>
        </form>
        <div v-if="!connected" class="text-center text-xs text-red-500 mt-1">
          连接断开，正在重新连接...
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.chat-container {
  height: 100vh;
  height: 100dvh;
}

.safe-area-top {
  padding-top: env(safe-area-inset-top);
  padding-top: max(env(safe-area-inset-top), 24px);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: max(env(safe-area-inset-bottom), 16px);
}

.chat-main {
  padding-top: 8px;
}
</style>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { LocalNotifications } from '@capacitor/local-notifications'
import { App } from '@capacitor/app'
import { Keyboard } from '@capacitor/keyboard'
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

// 请求通知权限
const requestNotificationPermission = async () => {
  try {
    const result = await LocalNotifications.requestPermissions()
    console.log('通知权限请求结果:', result)
    if (result.display === 'granted') {
      console.log('✅ 通知权限已授予')
    } else {
      console.log('⚠️  通知权限被拒绝')
    }
  } catch (error) {
    console.error('❌ 请求通知权限失败:', error)
  }
}

// 发送本地通知
const showNotification = async (message) => {
  try {
    console.log('🔔 准备发送通知:', message)
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
    console.log('✅ 通知已发送')
  } catch (error) {
    console.error('❌ 通知发送失败:', error)
  }
}

// 监听应用状态变化
const setupAppStateListener = () => {
  App.addListener('appStateChange', ({ isActive }) => {
    console.log('应用状态变化:', isActive ? '前台' : '后台')
  })
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

const handleInputFocus = () => {
  // 输入框聚焦时强制滚动
  setTimeout(() => {
    const main = document.querySelector('.chat-main')
    const footer = document.querySelector('footer')
    if (main && footer) {
      main.scrollTop = main.scrollHeight
      footer.scrollIntoView({ behavior: 'auto', block: 'end' })
    }
  }, 100)
  
  // 再次延迟滚动确保键盘弹出后位置正确
  setTimeout(() => {
    const footer = document.querySelector('footer')
    const input = footer?.querySelector('input')
    if (input) {
      input.scrollIntoView({ behavior: 'auto', block: 'center' })
    }
  }, 350)
}

const handleInputBlur = () => {
  // 输入框失去焦点时的处理
}

const scrollToBottom = () => {
  nextTick(() => {
    const main = document.querySelector('.chat-main')
    if (main) {
      main.scrollTop = main.scrollHeight
    }
  })
}

watch(messages, (newMessages) => {
  scrollToBottom()
  
  // 当收到新消息时发送通知
  const lastMessage = newMessages[newMessages.length - 1]
  if (lastMessage && lastMessage.username !== username.value) {
    showNotification(lastMessage)
  }
}, { deep: true })

onMounted(async () => {
  console.log('🚀 ChatView 已挂载')
  
  // 请求通知权限
  await requestNotificationPermission()
  
  // 设置应用状态监听
  setupAppStateListener()
  
  // 设置键盘事件监听
  Keyboard.addListener('keyboardWillShow', (info) => {
    console.log('键盘即将显示，高度:', info.keyboardHeight)
    // 强制滚动到底部，确保输入框可见
    setTimeout(() => {
      const main = document.querySelector('.chat-main')
      const footer = document.querySelector('footer')
      if (main && footer) {
        main.scrollTop = main.scrollHeight
        footer.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }, 50)
  })
  
  Keyboard.addListener('keyboardDidShow', (info) => {
    console.log('键盘已显示，高度:', info.keyboardHeight)
    // 再次确保滚动到底部
    setTimeout(() => {
      const main = document.querySelector('.chat-main')
      const footer = document.querySelector('footer')
      if (main && footer) {
        main.scrollTop = main.scrollHeight
        footer.scrollIntoView({ behavior: 'auto', block: 'end' })
        // 强制输入框获得焦点并滚动到可视区域
        const input = footer.querySelector('input')
        if (input) {
          input.scrollIntoView({ behavior: 'auto', block: 'center' })
        }
      }
    }, 100)
  })
  
  // 监听安卓返回按钮，阻止返回上一页
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      // 如果在聊天页面，不执行返回操作
      return
    }
    // 如果已经在最底层，则退出应用
    App.exitApp()
  })
  
  const token = localStorage.getItem('token')
  if (token) {
    connect(token)
  }
})

onUnmounted(() => {
  disconnect()
  App.removeAllListeners()
  Keyboard.removeAllListeners()
})
</script>

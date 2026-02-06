<template>
  <div class="min-h-screen bg-syntrx-50 p-4">
    <div class="max-w-4xl mx-auto">
      <header class="glass rounded-xl p-6 mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-syntrx-800">管理员控制台</h1>
        <div v-if="isAdminAuthenticated" class="flex items-center gap-3">
          <button
            @click="handleRefresh"
            :disabled="refreshing"
            class="px-4 py-2 bg-syntrx-100 hover:bg-syntrx-200 text-syntrx-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg v-if="refreshing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {{ refreshing ? '刷新中...' : '刷新数据' }}
          </button>
          <button
            @click="handleLogout"
            class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
      </header>

      <div v-if="!isAdminAuthenticated" class="bg-white rounded-xl shadow-lg p-6">
        <div v-if="!isSetup" class="text-center">
          <h2 class="text-xl font-bold text-gray-800 mb-4">首次设置管理员密码</h2>
          <form @submit.prevent="handleSetup" class="max-w-md mx-auto space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">设置管理员密码</label>
              <input
                v-model="setupPassword"
                type="password"
                placeholder="请输入管理员密码（至少6位）"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none"
              />
            </div>
            <div v-if="errorMessage" class="text-red-500 text-sm">
              {{ errorMessage }}
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-syntrx-600 hover:bg-syntrx-700 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {{ loading ? '设置中...' : '设置密码' }}
            </button>
          </form>
        </div>

        <div v-else class="text-center">
          <h2 class="text-xl font-bold text-gray-800 mb-4">管理员登录</h2>
          <form @submit.prevent="handleLogin" class="max-w-md mx-auto space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">管理员密码</label>
              <input
                v-model="loginPassword"
                type="password"
                placeholder="请输入管理员密码"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none"
              />
            </div>
            <div v-if="errorMessage" class="text-red-500 text-sm">
              {{ errorMessage }}
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-syntrx-600 hover:bg-syntrx-700 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </form>
          <div class="mt-4">
            <router-link to="/auth" class="text-sm text-syntrx-600 hover:text-syntrx-700">
              返回登录页面
            </router-link>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center gap-4">
            <button
              @click="currentTab = 'messages'"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                currentTab === 'messages' ? 'bg-syntrx-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              消息管理
            </button>
            <button
              @click="currentTab = 'users'"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                currentTab === 'users' ? 'bg-syntrx-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              用户管理
            </button>
          </div>
        </div>

        <div v-if="currentTab === 'messages'" class="divide-y divide-gray-200">
          <div class="p-4 border-b border-gray-200">
            <p class="text-sm text-gray-500">共 {{ messages.length }} 条消息</p>
          </div>
          <div
            v-for="message in messages"
            :key="message.id"
            class="p-4 transition-all"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-medium text-syntrx-700">{{ message.username }}</span>
                  <span class="text-sm text-gray-500">{{ formatTime(message.created_at) }}</span>
                </div>
                <div class="text-gray-800">
                  {{ message.content }}
                </div>
              </div>
              <button
                @click="handleRevoke(message.id)"
                class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                撤回
              </button>
            </div>
          </div>

          <div v-if="messages.length === 0" class="p-12 text-center text-gray-500">
            暂无消息
          </div>
        </div>

        <div v-else-if="currentTab === 'users'" class="divide-y divide-gray-200">
          <div class="p-4 border-b border-gray-200">
            <p class="text-sm text-gray-500">共 {{ users.length }} 位用户</p>
          </div>
          <div
            v-for="user in users"
            :key="user.id"
            class="p-4 transition-all"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-4 flex-1 min-w-0">
                <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-syntrx-200 flex-shrink-0">
                  <img :src="user.avatar || defaultAvatar" class="w-full h-full object-cover" alt="头像" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-syntrx-700">{{ user.username }}</div>
                  <div class="text-sm text-gray-500 truncate">{{ user.self_description || '该用户还没有写自我介绍' }}</div>
                  <div class="text-xs text-gray-400 mt-1">注册时间：{{ formatTime(user.created_at) }}</div>
                </div>
              </div>
              <button
                @click="handleDeleteUser(user.id, user.username)"
                class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                注销
              </button>
            </div>
          </div>

          <div v-if="users.length === 0" class="p-12 text-center text-gray-500">
            暂无用户
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdmin } from '../composables/useAuth'
import config from '../config'

const router = useRouter()
const {
  isAdminAuthenticated,
  checkSetup,
  setupAdmin,
  adminLogin,
  getAllMessages,
  revokeMessage,
  adminLogout
} = useAdmin()

const isSetup = ref(false)
const setupPassword = ref('')
const loginPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const messages = ref([])
const users = ref([])
const currentTab = ref('messages')
const refreshing = ref(false)
const defaultAvatar = config.defaultAvatar || ''

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSetup = async () => {
  if (setupPassword.value.length < 6) {
    errorMessage.value = '密码长度至少为6位'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const result = await setupAdmin(setupPassword.value)
    if (result.success) {
      isSetup.value = true
      setupPassword.value = ''
    } else {
      errorMessage.value = result.error
    }
  } catch (error) {
    errorMessage.value = '设置失败，请重试'
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await adminLogin(loginPassword.value)
    if (result.success) {
      await loadMessages()
      loginPassword.value = ''
    } else {
      errorMessage.value = result.error
    }
  } catch (error) {
    errorMessage.value = '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

const loadMessages = async () => {
  const result = await getAllMessages()
  if (result.success) {
    messages.value = result.messages
  }
}

const handleRevoke = async (messageId) => {
  if (confirm('确定要撤回这条消息吗？')) {
    const result = await revokeMessage(messageId)
    if (result.success) {
      await loadMessages()
    } else {
      alert(result.error || '撤回失败')
    }
  }
}

const handleLogout = () => {
  adminLogout()
  messages.value = []
  users.value = []
  isSetup.value = false
  router.push('/admin')
  window.location.reload()
}

const handleRefresh = async () => {
  refreshing.value = true
  try {
    if (currentTab.value === 'messages') {
      await loadMessages()
    } else {
      await loadUsers()
    }
  } catch (error) {
    console.error('刷新数据失败:', error)
    alert('刷新失败，请重试')
  } finally {
    refreshing.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    })
    const data = await response.json()
    users.value = data
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const handleDeleteUser = async (userId, username) => {
  if (confirm(`确定要注销用户"${username}"吗？此操作将删除该用户的所有消息和账户信息。`)) {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        await loadUsers()
      } else {
        alert(data.error || '注销用户失败')
      }
    } catch (error) {
      alert('注销用户失败，请重试')
    }
  }
}

onMounted(async () => {
  isSetup.value = await checkSetup()
  if (isAdminAuthenticated.value) {
    await loadMessages()
    await loadUsers()
  }
})
</script>

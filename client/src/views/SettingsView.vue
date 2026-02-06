<template>
  <div class="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-white p-4">
    <div class="max-w-lg mx-auto">
      <header class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-2">
          <h1 class="text-2xl font-bold text-syntrx-800">个人设置</h1>
          <router-link
            to="/chat"
            class="px-4 py-2 bg-syntrx-100 hover:bg-syntrx-200 text-syntrx-700 rounded-lg transition-colors"
          >
            返回
          </router-link>
        </div>
        <div class="mt-4 border-t border-syntrx-200"></div>
      </header>

      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div
          @click="showAvatarModal = true"
          class="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
        >
          <span class="text-gray-700 font-medium">头像</span>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-syntrx-200 shadow-sm hover:shadow-md hover:border-syntrx-400 transition-all">
              <img :src="avatar || defaultAvatar" class="w-full h-full object-cover" alt="头像" />
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>

        <div
          @click="showDescriptionModal = true"
          class="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
        >
          <span class="text-gray-700 font-medium">个人描述</span>
          <div class="flex items-center gap-3">
            <span class="text-gray-500 text-sm truncate max-w-[200px]">
              {{ selfDescription || '未填写' }}
            </span>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>

        <div
          @click="showPasswordModal = true"
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
        >
          <span class="text-gray-700 font-medium">修改密码</span>
          <div class="flex items-center gap-3">
            <span class="text-syntrx-600 text-sm">点击修改</span>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </div>

      <button
        @click="handleLogout"
        class="w-full mt-8 bg-[#FF4D4F] hover:bg-[#ff7875] text-white py-4 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg"
      >
        退出登录
      </button>
    </div>

    <div v-if="showAvatarModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">更换头像</h2>
        <div class="space-y-4">
          <button
            @click="selectDefaultAvatar"
            :class="[
              'w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3',
              selectedAvatar === defaultAvatar ? 'border-syntrx-600 bg-syntrx-50' : 'border-gray-300 hover:border-syntrx-400'
            ]"
          >
            <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <img :src="defaultAvatar" class="w-full h-full object-cover" alt="默认头像" />
            </div>
            <div class="text-left">
              <div class="font-medium text-gray-800">默认头像</div>
              <div class="text-sm text-gray-500">使用系统提供的默认头像</div>
            </div>
          </button>
          <button
            @click="handleShowCustomAvatarInput"
            :class="[
              'w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3',
              isCustomAvatar ? 'border-syntrx-600 bg-syntrx-50' : 'border-gray-300 hover:border-syntrx-400'
            ]"
          >
            <div class="w-12 h-12 rounded-full bg-syntrx-100 flex items-center justify-center flex-shrink-0 text-2xl">
              🔗
            </div>
            <div class="text-left">
              <div class="font-medium text-gray-800">自定义头像</div>
              <div class="text-sm text-gray-500">输入图片链接</div>
            </div>
          </button>
          <div v-if="showCustomAvatarInput" class="space-y-3">
            <input
              v-model="customAvatarUrl"
              @input="validateCustomAvatarUrl"
              @keyup.enter="confirmCustomAvatar"
              type="text"
              placeholder="粘贴图片链接，按回车确认"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
            />
            <div v-if="customAvatarUrlError" class="text-red-500 text-sm">
              {{ customAvatarUrlError }}
            </div>
            <button
              @click="confirmCustomAvatar"
              :disabled="!customAvatarUrl || !!customAvatarUrlError"
              class="w-full bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
            >
              确认使用此头像
            </button>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              @click="showAvatarModal = false"
              class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all"
            >
              取消
            </button>
            <button
              @click="saveAvatar"
              :disabled="!selectedAvatar"
              class="flex-1 bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDescriptionModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">编辑个人描述</h2>
        <div class="space-y-4">
          <div>
            <textarea
              v-model="editingDescription"
              placeholder="比如：'一名热爱旅行的设计师' 或 '今天也是元气满满的一天！'"
              rows="4"
              maxlength="100"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none resize-none transition-all"
            />
            <div class="text-right text-sm text-gray-400 mt-2">
              {{ editingDescription.length }}/100
            </div>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              @click="showDescriptionModal = false"
              class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all"
            >
              取消
            </button>
            <button
              @click="saveDescription"
              :disabled="saving"
              class="flex-1 bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPasswordModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">修改密码</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">旧密码</label>
            <input
              v-model="passwordForm.oldPassword"
              type="password"
              placeholder="请输入旧密码"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">新密码</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div v-if="passwordError" class="text-red-500 text-sm text-center">
            {{ passwordError }}
          </div>
          <div class="flex gap-3 pt-4">
            <button
              @click="showPasswordModal = false"
              class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all"
            >
              取消
            </button>
            <button
              @click="changePassword"
              :disabled="changingPassword"
              class="flex-1 bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
            >
              {{ changingPassword ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showToast" class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import axios from 'axios'
import config from '../config'

const router = useRouter()
const { username, avatar, userId, logout, setAuth } = useAuth()

const defaultAvatar = config.defaultAvatar || ''
const selfDescription = ref('')
const showAvatarModal = ref(false)
const showDescriptionModal = ref(false)
const showPasswordModal = ref(false)
const showCustomAvatarInput = ref(false)
const customAvatarUrl = ref('')
const selectedAvatar = ref('')
const editingDescription = ref('')
const customAvatarUrlError = ref('')
const saving = ref(false)
const changingPassword = ref(false)
const passwordError = ref('')
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showToast = ref(false)
const toastMessage = ref('')

const isCustomAvatar = computed(() => {
  return showCustomAvatarInput.value || (selectedAvatar.value !== defaultAvatar && selectedAvatar.value !== '')
})

const loadUserInfo = async () => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/api/user/info`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    selfDescription.value = response.data.self_description || ''
    selectedAvatar.value = response.data.avatar || defaultAvatar
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

const selectDefaultAvatar = () => {
  selectedAvatar.value = defaultAvatar
  showCustomAvatarInput.value = false
  customAvatarUrl.value = ''
  customAvatarUrlError.value = ''
}

const handleShowCustomAvatarInput = () => {
  const previousCustomAvatar = selectedAvatar.value !== defaultAvatar ? selectedAvatar.value : ''
  selectedAvatar.value = 'custom'
  showCustomAvatarInput.value = true
  customAvatarUrl.value = previousCustomAvatar
  validateCustomAvatarUrl()
}

const validateCustomAvatarUrl = () => {
  if (!customAvatarUrl.value) {
    customAvatarUrlError.value = ''
    return
  }
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const url = customAvatarUrl.value.toLowerCase()
  const hasValidExtension = allowedExtensions.some(ext => url.endsWith(ext))
  
  if (!hasValidExtension) {
    customAvatarUrlError.value = '只支持 .jpg, .jpeg, .png, .gif, .webp 格式的图片'
  } else {
    customAvatarUrlError.value = ''
  }
}

const confirmCustomAvatar = () => {
  if (customAvatarUrl.value) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const url = customAvatarUrl.value.toLowerCase()
    const hasValidExtension = allowedExtensions.some(ext => url.endsWith(ext))
    
    if (hasValidExtension) {
      selectedAvatar.value = customAvatarUrl.value
      showCustomAvatarInput.value = false
      customAvatarUrlError.value = ''
    } else {
      customAvatarUrlError.value = '只支持 .jpg, .jpeg, .png, .gif, .webp 格式的图片'
    }
  }
}

const saveAvatar = async () => {
  if (!selectedAvatar.value) return
  
  try {
    await axios.post(`${config.API_BASE_URL}/api/user/avatar`, {
      avatar: selectedAvatar.value
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    setAuth(localStorage.getItem('token'), username.value, userId.value, selectedAvatar.value)
    showAvatarModal.value = false
    showToastMessage('头像已更新')
  } catch (error) {
    alert(error.response?.data?.error || '更新头像失败')
  }
}

const saveDescription = async () => {
  saving.value = true
  
  try {
    await axios.post(`${config.API_BASE_URL}/api/user/description`, {
      self_description: editingDescription.value
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    selfDescription.value = editingDescription.value
    showDescriptionModal.value = false
    showToastMessage('个人描述已更新')
  } catch (error) {
    alert(error.response?.data?.error || '更新个人描述失败')
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  passwordError.value = ''
  
  if (!passwordForm.value.oldPassword) {
    passwordError.value = '请输入旧密码'
    return
  }
  
  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
    passwordError.value = '新密码至少6位'
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
    return
  }
  
  changingPassword.value = true
  
  try {
    await axios.post(`${config.API_BASE_URL}/api/user/password`, {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    showPasswordModal.value = false
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    showToastMessage('密码已修改')
  } catch (error) {
    passwordError.value = error.response?.data?.error || '修改密码失败'
  } finally {
    changingPassword.value = false
  }
}

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    logout()
  }
}

const showToastMessage = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
@keyframes bounce {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-10px);
  }
}

.animate-bounce {
  animation: bounce 0.5s ease-in-out;
}
</style>

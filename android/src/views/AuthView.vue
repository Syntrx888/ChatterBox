<template>
  <div class="min-h-screen bg-gradient-to-b from-[#D0E8F9] to-white flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div class="h-1 bg-syntrx-400 transition-all duration-500" :style="{ width: progressWidth }"></div>
      
      <div class="p-8">
        <transition name="fade" mode="out-in">
          <div :key="currentStep">
            <div v-if="currentStep === 'welcome'" class="text-center py-8">
              <div class="flex justify-center mb-6">
                <div class="flex space-x-2">
                  <div class="w-3 h-3 bg-syntrx-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                  <div class="w-3 h-3 bg-syntrx-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  <div class="w-3 h-3 bg-syntrx-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
              </div>
              <h1 class="text-3xl font-bold text-gray-800 mb-3">嗨，你好！</h1>
              <h2 class="text-2xl font-bold text-syntrx-600 mb-4">欢迎来到 {{ config.chatRoomName }}</h2>
              <p class="text-gray-600 mb-8">只需 {{ config.enableInviteCode ? 5 : 4 }} 步，即可开启畅聊。</p>
              <button
                @click="config.enableInviteCode ? (currentStep = 'inviteCode') : (currentStep = 'username')"
                class="w-full bg-syntrx-600 hover:bg-syntrx-700 text-white py-3 rounded-xl font-medium transition-all"
              >
                开始注册
              </button>
              <div class="mt-6">
                <button
                  @click="showLogin = true"
                  class="text-syntrx-600 hover:text-syntrx-700 transition-colors"
                >
                  已经注册账号？跳转到登录页
                </button>
              </div>
            </div>

            <div v-if="currentStep === 'username'" class="py-4">
              <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">{{ config.enableInviteCode ? '第二步' : '第一步' }}：取个名字吧</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">昵称</label>
                  <input
                    v-model="formData.username"
                    @input="checkUsername"
                    type="text"
                    placeholder="请输入你的昵称（3-12位字符）"
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
                    :class="usernameStatus.available ? 'border-green-500' : usernameStatus.checking ? 'border-yellow-500' : usernameStatus.available === false ? 'border-red-500' : 'border-gray-300'"
                  />
                  <div class="mt-2 flex items-center gap-2 text-sm">
                    <span v-if="usernameStatus.checking" class="text-yellow-600">检测中...</span>
                    <span v-else-if="usernameStatus.available === true" class="text-green-600 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                      昵称可用
                    </span>
                    <span v-else-if="usernameStatus.available === false" class="text-red-600 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                      {{ usernameStatus.error || '昵称已被占用' }}
                    </span>
                  </div>
                </div>
                <button
                  @click="currentStep = 'password'"
                  :disabled="!isUsernameValid"
                  class="w-full bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
                >
                  下一步 ->
                </button>
              </div>
            </div>

            <div v-if="currentStep === 'password'" class="py-4">
              <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">{{ config.enableInviteCode ? '第三步' : '第二步' }}：设置密码</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
                  <input
                    v-model="formData.password"
                    type="password"
                    placeholder="设置你的登录密码（至少6位）"
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
                  />
                  <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>建议包含字母和数字，至少六位</span>
                    <svg v-if="passwordStrength" class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 0v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012 0H5zm8-2v2H7V7a3 3 0 016 0v2h-1V7a5 5 0 00-10 0v2h-1V7a7 7 0 0114 0z" clip-rule="evenodd"></path></svg>
                  </div>
                </div>
                <button
                  @click="currentStep = 'avatar'"
                  :disabled="!isPasswordValid"
                  class="w-full bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
                >
                  下一步 ->
                </button>
              </div>
            </div>

            <div v-if="currentStep === 'inviteCode'" class="py-4">
              <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">第一步：输入邀请码</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">邀请码</label>
                  <input
                    v-model="formData.inviteCode"
                    @input="checkInviteCode"
                    type="text"
                    placeholder="请输入邀请码"
                    class="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
                    :class="inviteCodeStatus.valid ? 'border-green-500' : inviteCodeStatus.checking ? 'border-yellow-500' : inviteCodeStatus.valid === false ? 'border-red-500' : 'border-gray-300'"
                  />
                  <div class="mt-2 flex items-center gap-2 text-sm">
                    <span v-if="inviteCodeStatus.checking" class="text-yellow-600">验证中...</span>
                    <span v-else-if="inviteCodeStatus.valid === true" class="text-green-600 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                      邀请码有效
                    </span>
                    <span v-else-if="inviteCodeStatus.valid === false" class="text-red-600 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                      邀请码无效
                    </span>
                  </div>
                </div>
                <button
                  @click="currentStep = 'username'"
                  :disabled="!isInviteCodeValid"
                  class="w-full bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
                >
                  下一步 ->
                </button>
              </div>
            </div>

            <div v-if="currentStep === 'avatar'" class="py-4">
              <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">{{ config.enableInviteCode ? '第四步' : '第三步' }}：亮出你的形象</h2>
              <div class="space-y-6">
                <div class="flex flex-col md:flex-row items-center gap-6">
                  <div class="flex-shrink-0">
                    <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-syntrx-200 shadow-lg flex items-center justify-center bg-gray-100">
                      <img v-if="formData.avatar && formData.avatar !== ''" :src="formData.avatar" class="w-full h-full object-cover" alt="头像预览" />
                      <span v-else class="text-gray-500 font-bold text-sm text-center px-2 leading-tight">请输入头像URL</span>
                    </div>
                  </div>
                  <div class="flex-1 w-full space-y-3">
                    <button
                      @click="selectDefaultAvatar"
                      :class="[
                        'w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3',
                        formData.avatar === defaultAvatar ? 'border-syntrx-600 bg-syntrx-50' : 'border-gray-300 hover:border-syntrx-400'
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
                  </div>
                </div>

                <div v-if="showCustomAvatarInput" class="space-y-3">
                  <input
                    v-model="customAvatarUrl"
                    @keyup.enter="confirmCustomAvatar"
                    type="text"
                    placeholder="粘贴图片链接，按回车确认"
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
                  />
                  <div v-if="customAvatarUrlError !== false" class="text-red-500 text-sm">
                    {{ customAvatarUrlError }}
                  </div>
                  <div v-if="avatarError !== false" class="text-red-500 text-sm">
                    {{ avatarError }}
                  </div>
                  <button
                    @click="confirmCustomAvatar"
                    :disabled="!customAvatarUrl"
                    class="w-full bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
                  >
                    确认使用此头像
                  </button>
                </div>

                <button
                  @click="currentStep = 'description'"
                  :disabled="loading || avatarError"
                  class="w-full bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
                >
                  下一步 ->
                </button>
              </div>
            </div>

            <div v-if="currentStep === 'description'" class="py-4">
              <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">{{ config.enableInviteCode ? '第五步' : '第四步' }}：一句话介绍自己</h2>
              <p class="text-center text-gray-500 text-sm mb-6">（选填）让大家更快了解你，或者留个有趣的签名</p>
              <div class="space-y-4">
                <div>
                  <textarea
                    v-model="formData.self_description"
                    @input="handleDescriptionInput"
                    placeholder="比如：'一名热爱旅行的设计师' 或 '今天也是元气满满的一天！'"
                    rows="4"
                    maxlength="100"
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none resize-none transition-all"
                  />
                  <div class="text-right text-sm text-gray-400">
                    {{ formData.self_description.length }}/100
                  </div>
                </div>
                <button
                  @click="handleRegister"
                  :disabled="loading"
                  :class="[
                    'w-full bg-gradient-to-r from-syntrx-600 to-syntrx-700 hover:from-syntrx-700 hover:to-syntrx-800 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg',
                    formData.self_description && 'animate-pulse'
                  ]"
                >
                  {{ loading ? '注册中...' : '完成，进入聊天室！' }}
                </button>
                <div class="mt-4 text-center">
                  <button
                    @click="handleSkipDescription"
                    class="text-syntrx-600 hover:text-syntrx-700 transition-colors text-sm"
                  >
                    先不写了，直接进入 >
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="showLogin" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">登录</h2>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <input
              v-model="loginForm.username"
              type="text"
              placeholder="请输入用户名"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-syntrx-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div v-if="loginError" class="text-red-500 text-sm text-center">
            {{ loginError }}
          </div>
          <button
            type="submit"
            :disabled="loginLoading"
            class="w-full bg-syntrx-600 hover:bg-syntrx-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-all"
          >
            {{ loginLoading ? '登录中...' : '登录' }}
          </button>
          <button
            type="button"
            @click="showLogin = false"
            class="w-full text-syntrx-600 hover:text-syntrx-700 transition-colors"
          >
            返回注册
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import axios from 'axios'
import config from '../config'

const router = useRouter()
const { register, login } = useAuth()

const currentStep = ref('welcome')
const showLogin = ref(false)

const formData = ref({
  username: '',
  password: '',
  avatar: '',
  self_description: '',
  inviteCode: ''
})

const loginForm = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const loginLoading = ref(false)
const loginError = ref('')

const usernameStatus = ref({
  checking: false,
  available: null,
  error: ''
})

const inviteCodeStatus = ref({
  checking: false,
  valid: null
})

const customAvatarUrl = ref('')
const showCustomAvatarInput = ref(false)

const defaultAvatar = config.defaultAvatar

const progressWidth = computed(() => {
  const steps = config.enableInviteCode 
    ? ['welcome', 'inviteCode', 'username', 'password', 'avatar', 'description']
    : ['welcome', 'username', 'password', 'avatar', 'description']
  const currentIndex = steps.indexOf(currentStep.value)
  return `${((currentIndex + 1) / steps.length) * 100}%`
})

const isUsernameValid = computed(() => {
  const trimmedUsername = formData.value.username.trim()
  return trimmedUsername.length >= 3 && 
         trimmedUsername.length <= 12 && 
         usernameStatus.value.available === true
})

const isPasswordValid = computed(() => {
  const pwd = formData.value.password.trim()
  return pwd.length >= 6
})

const isInviteCodeValid = computed(() => {
  if (!config.enableInviteCode) {
    return true
  }
  return inviteCodeStatus.value.valid === true
})

const passwordStrength = computed(() => {
  const pwd = formData.value.password
  return pwd.length >= 6 && /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd)
})

const isCustomAvatar = computed(() => {
  return showCustomAvatarInput.value || (formData.value.avatar !== defaultAvatar && formData.value.avatar !== '')
})

const avatarError = computed(() => {
  if (formData.value.avatar === defaultAvatar || formData.value.avatar === '') {
    return false
  }
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const url = formData.value.avatar.toLowerCase()
  const hasValidExtension = allowedExtensions.some(ext => url.endsWith(ext))
  
  if (!hasValidExtension) {
    return '只支持 .jpg, .jpeg, .png, .gif, .webp 格式的图片'
  }
  
  return false
})

const customAvatarUrlError = computed(() => {
  if (!customAvatarUrl.value) {
    return false
  }
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const url = customAvatarUrl.value.toLowerCase()
  const hasValidExtension = allowedExtensions.some(ext => url.endsWith(ext))
  
  if (!hasValidExtension) {
    return '只支持 .jpg, .jpeg, .png, .gif, .webp 格式的图片'
  }
  
  return false
})

let usernameCheckTimer = null
let inviteCodeCheckTimer = null

const checkUsername = () => {
  const username = formData.value.username.trim()
  
  if (username.length < 3 || username.length > 12) {
    usernameStatus.value = { checking: false, available: null, error: '' }
    return
  }

  usernameStatus.value = { checking: true, available: null, error: '' }
  
  clearTimeout(usernameCheckTimer)
  usernameCheckTimer = setTimeout(async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/check-username`, {
        params: { username }
      })
      usernameStatus.value = { checking: false, available: true, error: '' }
    } catch (error) {
      const errorMsg = error.response?.data?.error || ''
      
      if (errorMsg === '该昵称已被占用') {
        usernameStatus.value = { checking: false, available: false, error: errorMsg }
      } else {
        usernameStatus.value = { checking: false, available: true, error: '' }
      }
    }
  }, 500)
}

const checkInviteCode = () => {
  if (!config.enableInviteCode) {
    return
  }

  const inviteCode = formData.value.inviteCode.trim()
  
  if (!inviteCode) {
    inviteCodeStatus.value = { checking: false, valid: false }
    return
  }

  inviteCodeStatus.value = { checking: true, valid: null }
  
  clearTimeout(inviteCodeCheckTimer)
  inviteCodeCheckTimer = setTimeout(async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/check-invite-code`, {
        params: { inviteCode }
      })
      inviteCodeStatus.value = { checking: false, valid: response.data.valid }
    } catch (error) {
      inviteCodeStatus.value = { checking: false, valid: false }
    }
  }, 500)
}

const selectDefaultAvatar = () => {
  formData.value.avatar = defaultAvatar
  showCustomAvatarInput.value = false
}

const handleShowCustomAvatarInput = () => {
  showCustomAvatarInput.value = true
  formData.value.avatar = customAvatarUrl.value || ''
}

const confirmCustomAvatar = () => {
  if (customAvatarUrl.value) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const url = customAvatarUrl.value.toLowerCase()
    const hasValidExtension = allowedExtensions.some(ext => url.endsWith(ext))
    
    if (hasValidExtension) {
      formData.value.avatar = customAvatarUrl.value
      showCustomAvatarInput.value = false
    }
  }
}

const handleRegister = async () => {
  if (!isUsernameValid.value || !isPasswordValid.value) {
    return
  }

  if (config.enableInviteCode && !isInviteCodeValid.value) {
    return
  }

  loading.value = true
  
  try {
    const trimmedUsername = formData.value.username.trim()
    const trimmedPassword = formData.value.password.trim()
    const result = await register(trimmedUsername, trimmedPassword, formData.value.avatar, formData.value.self_description, formData.value.inviteCode)
    if (result.success) {
      router.push('/chat')
    }
  } catch (error) {
    alert(error.response?.data?.error || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleSkipDescription = () => {
  formData.value.self_description = ''
  handleRegister()
}

const handleDescriptionInput = () => {
  if (formData.value.self_description.length > 100) {
    formData.value.self_description = formData.value.self_description.slice(0, 100)
  }
}

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    loginError.value = '用户名和密码不能为空'
    return
  }

  loginLoading.value = true
  loginError.value = ''

  try {
    const result = await login(loginForm.value.username, loginForm.value.password)
    if (result.success) {
      router.push('/chat')
    } else {
      loginError.value = result.error || '登录失败'
    }
  } catch (error) {
    loginError.value = error.response?.data?.error || '登录失败'
  } finally {
    loginLoading.value = false
  }
}

watch(() => currentStep.value, () => {
  if (currentStep.value === 'avatar' && !formData.value.avatar) {
    formData.value.avatar = defaultAvatar
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import config from '../config'
import { io } from 'socket.io-client'

export function useAuth() {
  const router = useRouter()
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')
  const userId = ref(parseInt(localStorage.getItem('userId')) || null)
  const avatar = ref(localStorage.getItem('avatar') || '')
  const isAuthenticated = computed(() => !!token.value)

  const setAuth = (newToken, newUsername, newUserId, newAvatar) => {
    token.value = newToken
    username.value = newUsername
    userId.value = newUserId
    avatar.value = newAvatar
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', newUsername)
    localStorage.setItem('userId', newUserId)
    localStorage.setItem('avatar', newAvatar)
  }

  const clearAuth = () => {
    token.value = ''
    username.value = ''
    userId.value = null
    avatar.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
    localStorage.removeItem('avatar')
  }

  const verifyToken = async () => {
    try {
      console.log('🔍 开始验证 token...')
      const response = await api.post('/api/verify-token', {
        token: token.value
      })
      console.log('✅ Token 验证成功:', response.data)
      return response.data.valid
    } catch (error) {
      console.error('❌ Token 验证失败:', error)
      return false
    }
  }

  const login = async (usernameInput, password) => {
    try {
      console.log('🔐 开始登录:', usernameInput)
      const response = await api.post('/api/login', {
        username: usernameInput,
        password
      })
      console.log('✅ 登录成功:', response.data)
      setAuth(response.data.token, response.data.username, response.data.userId, response.data.avatar)
      return { success: true }
    } catch (error) {
      console.error('❌ 登录失败:', error)
      return { success: false, error: error.response?.data?.error || '登录失败' }
    }
  }

  const register = async (usernameInput, password, avatarInput, selfDescription = '', inviteCode = '') => {
    try {
      console.log('📝 开始注册:', usernameInput)
      const response = await api.post('/api/register', {
        username: usernameInput,
        password,
        avatar: avatarInput,
        self_description: selfDescription,
        inviteCode
      })
      console.log('✅ 注册成功:', response.data)
      setAuth(response.data.token, response.data.username, response.data.userId, response.data.avatar)
      return { success: true }
    } catch (error) {
      console.error('❌ 注册失败:', error)
      return { success: false, error: error.response?.data?.error || '注册失败' }
    }
  }

  const logout = () => {
    clearAuth()
    router.push('/auth')
  }

  return {
    token,
    username,
    userId,
    avatar,
    isAuthenticated,
    setAuth,
    clearAuth,
    verifyToken,
    login,
    register,
    logout
  }
}

export function useSocket() {
  const socket = ref(null)
  const connected = ref(false)
  const messages = ref([])

  const connect = (token) => {
    console.log('🔌 连接 WebSocket...')
    if (socket.value) {
      socket.value.disconnect()
    }

    socket.value = io(config.API_BASE_URL, {
      auth: { token },
      transports: ['websocket']
    })

    socket.value.on('connect', () => {
      console.log('✅ WebSocket 已连接')
      connected.value = true
    })

    socket.value.on('disconnect', () => {
      console.log('❌ WebSocket 已断开')
      connected.value = false
    })

    socket.value.on('error', (errorData) => {
      console.error('❌ WebSocket 错误:', errorData)
      alert(errorData.message || '发生错误')
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('userId')
      localStorage.removeItem('avatar')
      window.location.hash = '#/auth'
    })

    socket.value.on('historyMessages', (historyMessages) => {
      console.log('📜 收到历史消息:', historyMessages.length)
      messages.value = historyMessages
    })

    socket.value.on('newMessage', (message) => {
      console.log('💬 收到新消息:', message)
      messages.value.push(message)
    })

    socket.value.on('messageDeleted', ({ messageId }) => {
      console.log('🗑️ 消息已删除:', messageId)
      const msgIndex = messages.value.findIndex(m => m.id === messageId)
      if (msgIndex !== -1) {
        messages.value.splice(msgIndex, 1)
      }
    })

    socket.value.on('connect_error', (error) => {
      console.error('❌ WebSocket 连接错误:', error)
      connected.value = false
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
      messages.value = []
    }
  }

  const sendMessage = (content) => {
    if (socket.value && connected.value) {
      const token = localStorage.getItem('token')
      console.log('📤 发送消息:', content)
      socket.value.emit('sendMessage', { content, token })
    }
  }

  return {
    socket,
    connected,
    messages,
    connect,
    disconnect,
    sendMessage
  }
}

export function useAdmin() {
  const adminToken = ref(localStorage.getItem('adminToken') || '')
  const isAdminAuthenticated = computed(() => !!adminToken.value)

  const checkSetup = async () => {
    try {
      const response = await api.get('/api/admin/check-setup')
      return response.data.isSetup
    } catch (error) {
      return false
    }
  }

  const setupAdmin = async (password) => {
    try {
      await api.post('/api/admin/setup', { password })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '设置失败' }
    }
  }

  const adminLogin = async (password) => {
    try {
      const response = await api.post('/api/admin/login', { password })
      adminToken.value = response.data.token
      localStorage.setItem('adminToken', response.data.token)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '登录失败' }
    }
  }

  const getAllMessages = async () => {
    try {
      const response = await api.get('/api/admin/messages', {
        headers: {
          Authorization: `Bearer ${adminToken.value}`
        }
      })
      return { success: true, messages: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '获取失败' }
    }
  }

  const revokeMessage = async (messageId) => {
    try {
      await api.post('/api/admin/revoke-message', { messageId }, {
        headers: {
          Authorization: `Bearer ${adminToken.value}`
        }
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '撤回失败' }
    }
  }

  const adminLogout = () => {
    adminToken.value = ''
    localStorage.removeItem('adminToken')
    window.location.hash = '#/auth'
  }

  return {
    adminToken,
    isAdminAuthenticated,
    checkSetup,
    setupAdmin,
    adminLogin,
    getAllMessages,
    revokeMessage,
    adminLogout
  }
}

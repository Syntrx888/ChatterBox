import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
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
      const response = await axios.post(`${config.API_BASE_URL}/api/verify-token`, {
        token: token.value
      })
      return response.data.valid
    } catch (error) {
      return false
    }
  }

  const login = async (usernameInput, password) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/login`, {
        username: usernameInput,
        password
      })
      setAuth(response.data.token, response.data.username, response.data.userId, response.data.avatar)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '登录失败' }
    }
  }

  const register = async (usernameInput, password, avatarInput, selfDescription = '') => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/register`, {
        username: usernameInput,
        password,
        avatar: avatarInput,
        self_description: selfDescription
      })
      setAuth(response.data.token, response.data.username, response.data.userId, response.data.avatar)
      return { success: true }
    } catch (error) {
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
    if (socket.value) {
      socket.value.disconnect()
    }

    socket.value = io(config.API_BASE_URL, {
      auth: { token },
      transports: ['websocket']
    })

    socket.value.on('connect', () => {
      connected.value = true
    })

    socket.value.on('disconnect', () => {
      connected.value = false
    })

    socket.value.on('error', (errorData) => {
      alert(errorData.message || '发生错误')
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('userId')
      localStorage.removeItem('avatar')
      window.location.hash = '#/auth'
    })

    socket.value.on('historyMessages', (historyMessages) => {
      messages.value = historyMessages
    })

    socket.value.on('newMessage', (message) => {
      messages.value.push(message)
    })

    socket.value.on('messageDeleted', ({ messageId }) => {
      const msgIndex = messages.value.findIndex(m => m.id === messageId)
      if (msgIndex !== -1) {
        messages.value.splice(msgIndex, 1)
      }
    })

    socket.value.on('connect_error', (error) => {
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
      const response = await axios.get(`${config.API_BASE_URL}/api/admin/check-setup`)
      return response.data.isSetup
    } catch (error) {
      return false
    }
  }

  const setupAdmin = async (password) => {
    try {
      await axios.post(`${config.API_BASE_URL}/api/admin/setup`, { password })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '设置失败' }
    }
  }

  const adminLogin = async (password) => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/admin/login`, { password })
      adminToken.value = response.data.token
      localStorage.setItem('adminToken', response.data.token)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '登录失败' }
    }
  }

  const getAllMessages = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/admin/messages`, {
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
      await axios.post(`${config.API_BASE_URL}/api/admin/revoke-message`, { messageId }, {
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

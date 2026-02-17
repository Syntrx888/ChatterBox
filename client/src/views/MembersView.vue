<template>
  <div class="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-white p-4">
    <div class="max-w-6xl mx-auto">
      <header class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h1 class="text-3xl font-bold text-syntrx-800">聊天室成员</h1>
            <div class="text-xs text-syntrx-400 mt-0.5">
              Powered by <a href="https://github.com/Syntrx888/ChatterBox" target="_blank" rel="noopener noreferrer" class="text-syntrx-400 hover:text-syntrx-500 underline decoration-dotted underline-offset-2">ChatterBox</a>
            </div>
          </div>
          <router-link
            to="/chat"
            class="px-4 py-2 bg-syntrx-600 hover:bg-syntrx-700 text-white rounded-lg transition-colors"
          >
            返回聊天室
          </router-link>
        </div>
        <p class="text-gray-500">这里汇聚了所有热爱交流的伙伴</p>
        <div class="mt-4 border-t border-syntrx-200"></div>
      </header>

      <div v-if="loading" class="text-center py-12">
        <div class="flex justify-center mb-4">
          <div class="flex space-x-2">
            <div class="w-4 h-4 bg-syntrx-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-4 h-4 bg-syntrx-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-4 h-4 bg-syntrx-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
        <p class="text-gray-500">加载中...</p>
      </div>

      <div v-else-if="members.length === 0" class="text-center py-12">
        <p class="text-gray-500">暂无成员</p>
      </div>

      <transition-group
        v-else
        name="fade-up"
        tag="div"
        class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
      >
        <div
          v-for="member in members"
          :key="member.id"
          class="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] group"
        >
          <div class="flex flex-col items-center p-3 sm:p-4 md:p-6">
            <div class="relative mb-2 sm:mb-3 md:mb-4">
              <div class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 sm:border-4 border-syntrx-200 shadow-sm sm:shadow-md group-hover:scale-110 transition-transform duration-300">
                <img :src="member.avatar || config.defaultAvatar || defaultPlaceholder" class="w-full h-full object-cover" alt="头像" />
              </div>
            </div>
            <h3 class="text-sm sm:text-base md:text-xl font-bold text-syntrx-800 mb-1 sm:mb-2 truncate w-full text-center px-1">{{ member.username }}</h3>
            <p 
              class="text-xs sm:text-sm text-gray-600 text-center leading-relaxed line-clamp-2"
              :title="member.self_description || '该用户还没有写自我介绍'"
            >
              {{ member.self_description || '该用户还没有写自我介绍' }}
            </p>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import config from '../config'

const members = ref([])
const loading = ref(true)
const defaultPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23E5E7EB"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-size="40" fill="%239CA3AF"%3E?%3C/text%3E%3C/svg%3E'

const loadMembers = async () => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/api/members`)
    members.value = response.data
  } catch (error) {
    console.error('获取成员列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMembers()
})
</script>

<style scoped>
.fade-up-enter-active {
  transition: all 0.5s ease-out;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

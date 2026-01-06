<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { scrollToTop } from 'lazy-js-utils'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

useHead({
  meta: [
    { property: 'og:title', content: 'Kele' },
    { property: 'og:image', content: '/black.png' },
    { name: 'description', content: 'Kele\'s Portfolio' },
  ],
})

const router = useRouter()
const routerMap: any = {
  '/': 'Kele',
  '/projects': '项目',
  '/posts': '博客',
}

const text = ref('')
watch(
  router.currentRoute,
  (val) => {
    text.value = routerMap[val.path] || 'Docs'
  },
  { immediate: true },
)

const isShow = ref(false)
useEventListener(
  document,
  'scroll',
  e => (isShow.value = document.documentElement.scrollTop > 500),
)
</script>

<template>
  <NavBar />
  <main class="px-7 py-10" overflow-x-hidden>
    <router-view />
    <Footer />
  </main>
  <div
    v-if="isShow"
    fixed bottom-10 right-5 text-2xl cursor-pointer opacity-60 hover:opacity-100
    @click="scrollToTop()"
  >
    ↑ Top
  </div>
</template>

<style>
body {
  cursor: url(https://cdn.custom-cursor.com/db/8130/32/manga-himouto-umaru-chan-umaru-and-cola-cursor.png),
    default !important;
}

a,
.link {
  cursor: url(https://cdn.custom-cursor.com/db/8129/32/manga-himouto-umaru-chan-umaru-and-cola-pointer.png),
    pointer !important;
}

.rotated-hand {
  animation: rotate 1s 0.5s infinite linear alternate-reverse;
}

@keyframes rotate {
  0% {
    transform: rotate(-20deg);
  }

  100% {
    transform: rotate(30deg);
  }
}
</style>

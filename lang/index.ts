import type { Ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
// @unocss-include
import { computed, ref } from 'vue'

const language = ref<'zh'>('zh')
export const lan = useLocalStorage('kele.me.language', language) as Ref<'zh'>

const json = {
  zh: {
    title: 'Hi，你好 <%><span class="rotated-hand" i-noto:waving-hand></span></%>，我是 Kele，一名前端工程师 <%><span class="i-mdi:code-braces"></span></%>，最近几年在探索用 AI 提升个人工作和生活效率 <%><span class="i-mdi:robot-outline"></span></%>',
    contents: [
      '作为一名前端工程师，我热爱用代码创造有价值的产品。',
      '最近几年，我开始深入探索 AI 技术，尝试将其融入日常工作和生活中，提升效率、解放双手。',
      '我相信 AI 不仅是工具，更是思维方式的变革。通过不断学习和实践，我希望能够更好地驾驭这项技术，创造更多可能性。',
      '<span font-mono>......</span>',
      '如果你对 AI 提效、前端开发有兴趣，欢迎来和我交流～',
    ],
    findMe: [
      '<span i-ri:user-search-fill></span>可以在 <a href="https://github.com/Aaronwn" alt="GitHub" ><span i-carbon:logo-github></span> GitHub</a> 找到我。',
    ],
  },
}

export const $t = computed(() => json.zh)

export function setLan() {
  // 仅中文，无需切换
}

export const isZh = computed(() => true)

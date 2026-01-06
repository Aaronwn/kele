---
title: 微前端架构实践：从 0 到 1 的落地经验
description: 分享企业级微前端架构的设计思路、技术选型和踩坑经验
date: 2024-11-12
lang: zh
duration: 20min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

随着业务发展，前端项目逐渐变得庞大臃肿。团队扩张后，多人协作同一个巨石应用的痛点愈发明显：构建慢、发布耦合、技术栈绑定。微前端架构应运而生，让我们能够将大型应用拆分为独立开发、独立部署的子应用。

本文将分享我们团队从 0 到 1 落地微前端的实践经验。

## 为什么需要微前端

### 巨石应用的痛点

- **构建时间长** - 代码量大，每次构建需要十几分钟
- **发布耦合** - 修改一个模块需要整体发布，风险高
- **技术债务** - 老旧代码难以升级，新技术难以引入
- **团队协作** - 代码冲突频繁，模块边界模糊

### 微前端的价值

- **独立开发部署** - 子应用独立迭代，互不影响
- **技术栈无关** - 不同子应用可以使用不同框架
- **增量升级** - 逐步替换老旧模块
- **团队自治** - 明确的模块边界和责任划分

## 技术选型

### 主流方案对比

| 方案 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| iframe | 原生隔离 | 隔离彻底 | 通信复杂、性能差、体验割裂 |
| qiankun | JS 沙箱 + CSS 隔离 | 成熟稳定、接入简单 | 沙箱有损耗、CSS 隔离不完美 |
| micro-app | WebComponent | 接入更简单 | 社区相对较小 |
| Module Federation | Webpack 5 原生 | 模块共享、性能好 | 需要 Webpack 5、配置复杂 |

我们最终选择了 **qiankun**，原因：
1. 社区成熟，文档完善
2. 对现有项目侵入性小
3. 支持 Vue 2/3、React 等多框架

## 架构设计

### 项目结构

```text
micro-frontend/
├── main-app/                 # 主应用（基座）
│   ├── src/
│   │   ├── micro/           # 微前端配置
│   │   │   ├── apps.ts      # 子应用注册
│   │   │   └── lifeCycles.ts
│   │   ├── layout/          # 公共布局
│   │   └── router/          # 主路由
│   └── package.json
│
├── sub-app-vue/             # Vue 子应用
│   ├── src/
│   │   ├── public-path.ts   # 动态 publicPath
│   │   └── main.ts
│   └── vue.config.js
│
├── sub-app-react/           # React 子应用
│   ├── src/
│   │   ├── public-path.ts
│   │   └── index.tsx
│   └── config-overrides.js
│
└── shared/                  # 共享库
    ├── utils/
    ├── components/
    └── types/
```

## 主应用实现

### 注册子应用

```typescript
// main-app/src/micro/apps.ts
import { registerMicroApps, start, addGlobalUncaughtErrorHandler } from 'qiankun'

interface MicroApp {
  name: string
  entry: string
  container: string
  activeRule: string
  props?: Record<string, unknown>
}

const apps: MicroApp[] = [
  {
    name: 'sub-vue',
    entry: process.env.VUE_APP_SUB_VUE || '//localhost:8081',
    container: '#sub-app-container',
    activeRule: '/app-vue',
    props: {
      routerBase: '/app-vue'
    }
  },
  {
    name: 'sub-react',
    entry: process.env.VUE_APP_SUB_REACT || '//localhost:8082',
    container: '#sub-app-container',
    activeRule: '/app-react',
    props: {
      routerBase: '/app-react'
    }
  }
]

export function setupMicroApps() {
  registerMicroApps(apps, {
    beforeLoad: async (app) => {
      console.log(`[主应用] ${app.name} 开始加载`)
    },
    beforeMount: async (app) => {
      console.log(`[主应用] ${app.name} 开始挂载`)
    },
    afterUnmount: async (app) => {
      console.log(`[主应用] ${app.name} 已卸载`)
    }
  })

  // 全局错误处理
  addGlobalUncaughtErrorHandler((event) => {
    console.error('[微前端全局错误]', event)
  })

  start({
    sandbox: {
      strictStyleIsolation: false,  // 严格样式隔离（使用 Shadow DOM）
      experimentalStyleIsolation: true  // 实验性样式隔离（添加前缀）
    },
    prefetch: 'all'  // 预加载所有子应用
  })
}
```

### 主应用布局

```vue
<!-- main-app/src/layout/MainLayout.vue -->
<template>
  <div class="main-layout">
    <header class="header">
      <nav>
        <router-link to="/app-vue">Vue 子应用</router-link>
        <router-link to="/app-react">React 子应用</router-link>
      </nav>
      <UserMenu />
    </header>

    <main class="main-content">
      <!-- 主应用自己的路由 -->
      <router-view v-if="!isMicroApp" />
      <!-- 子应用容器 -->
      <div id="sub-app-container" v-show="isMicroApp" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const microAppPrefixes = ['/app-vue', '/app-react']

const isMicroApp = computed(() =>
  microAppPrefixes.some(prefix => route.path.startsWith(prefix))
)
</script>
```

## 子应用改造

### Vue 3 子应用

```typescript
// sub-app-vue/src/public-path.ts
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}

// sub-app-vue/src/main.ts
import './public-path'
import { createApp, App as VueApp } from 'vue'
import { createRouter, createWebHistory, Router } from 'vue-router'
import App from './App.vue'
import routes from './router'

let app: VueApp | null = null
let router: Router | null = null

function render(props: { container?: Element; routerBase?: string } = {}) {
  const { container, routerBase = '/' } = props

  router = createRouter({
    history: createWebHistory(
      window.__POWERED_BY_QIANKUN__ ? routerBase : '/'
    ),
    routes
  })

  app = createApp(App)
  app.use(router)
  app.mount(container ? container.querySelector('#app')! : '#app')
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

// 导出生命周期钩子
export async function bootstrap() {
  console.log('[sub-vue] bootstraped')
}

export async function mount(props: any) {
  console.log('[sub-vue] mount', props)
  render(props)
}

export async function unmount() {
  console.log('[sub-vue] unmount')
  app?.unmount()
  app = null
  router = null
}
```

### Webpack 配置

```javascript
// sub-app-vue/vue.config.js
const { name } = require('./package.json')

module.exports = {
  devServer: {
    port: 8081,
    headers: {
      'Access-Control-Allow-Origin': '*'  // 允许跨域
    }
  },
  configureWebpack: {
    output: {
      library: `${name}-[name]`,
      libraryTarget: 'umd',  // 把子应用打包成 umd 库格式
      chunkLoadingGlobal: `webpackJsonp_${name}`
    }
  }
}
```

## 应用通信

### 全局状态共享

```typescript
// main-app/src/micro/globalState.ts
import { initGlobalState, MicroAppStateActions } from 'qiankun'

interface GlobalState {
  user: { id: string; name: string } | null
  token: string | null
  theme: 'light' | 'dark'
}

const initialState: GlobalState = {
  user: null,
  token: null,
  theme: 'light'
}

const actions: MicroAppStateActions = initGlobalState(initialState)

// 主应用监听变化
actions.onGlobalStateChange((state, prev) => {
  console.log('[主应用] 全局状态变化', state, prev)
})

// 导出给主应用使用
export function setGlobalState(state: Partial<GlobalState>) {
  actions.setGlobalState(state)
}

export function getGlobalState(): GlobalState {
  return actions.getGlobalState() as GlobalState
}
```

### 子应用接收状态

```typescript
// sub-app-vue/src/main.ts
export async function mount(props: any) {
  const { onGlobalStateChange, setGlobalState } = props

  // 监听全局状态
  onGlobalStateChange((state: any, prev: any) => {
    console.log('[sub-vue] 全局状态变化', state, prev)
    // 同步到子应用的状态管理
    store.commit('updateUser', state.user)
  }, true)  // true 表示立即执行一次

  // 修改全局状态
  setGlobalState({ theme: 'dark' })

  render(props)
}
```

### 自定义事件通信

```typescript
// shared/eventBus.ts
type EventCallback = (...args: any[]) => void

class EventBus {
  private events = new Map<string, Set<EventCallback>>()

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback)
    return () => this.off(event, callback)
  }

  off(event: string, callback: EventCallback) {
    this.events.get(event)?.delete(callback)
  }

  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach(cb => cb(...args))
  }
}

// 挂载到 window，供所有应用使用
window.__MICRO_EVENT_BUS__ = window.__MICRO_EVENT_BUS__ || new EventBus()

export const eventBus = window.__MICRO_EVENT_BUS__
```

## 常见问题与解决方案

### 样式隔离

```typescript
// 方案1：CSS Modules
// 子应用使用 CSS Modules，自带哈希，天然隔离

// 方案2：BEM 命名 + 应用前缀
// .sub-vue-header__title {}

// 方案3：experimentalStyleIsolation
start({
  sandbox: {
    experimentalStyleIsolation: true
  }
})
// qiankun 会自动给子应用样式添加前缀
```

### 静态资源路径

```typescript
// 确保设置 public-path
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}

// CSS 中的图片路径问题
// 使用绝对路径或 base64
.logo {
  background-image: url('//cdn.example.com/logo.png');
}
```

### 路由冲突

```typescript
// 子应用路由必须使用 routerBase
const router = createRouter({
  history: createWebHistory(props.routerBase),
  routes
})

// 子应用内部跳转主应用路由
function goToMainApp(path: string) {
  history.pushState(null, '', path)
  // 触发主应用路由监听
  window.dispatchEvent(new PopStateEvent('popstate'))
}
```

## 部署策略

### Nginx 配置

```nginx
# 主应用
server {
    listen 80;
    server_name app.example.com;

    location / {
        root /www/main-app;
        try_files $uri $uri/ /index.html;
    }

    # 子应用代理
    location /sub-vue/ {
        proxy_pass http://sub-vue-server/;
        add_header Access-Control-Allow-Origin *;
    }

    location /sub-react/ {
        proxy_pass http://sub-react-server/;
        add_header Access-Control-Allow-Origin *;
    }
}
```

## 总结

微前端落地的关键点：

1. **明确边界** - 按业务域拆分，而非技术拆分
2. **渐进迁移** - 新功能用新子应用，老功能逐步迁移
3. **统一规范** - 通信协议、路由规范、样式规范
4. **基础设施** - 完善的 CI/CD、监控告警

微前端不是银弹，它解决了巨石应用的问题，但也带来了复杂度。在决定采用前，需要权衡团队规模、项目复杂度和维护成本。

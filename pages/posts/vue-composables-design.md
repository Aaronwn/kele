---
title: Vue 3 Composables 设计模式与最佳实践
description: 深入探讨 Vue 3 组合式函数的设计原则、常见模式和工程实践
date: 2024-12-20T10:00:00.000+00:00
lang: zh
duration: 15min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

在使用 Vue 3 开发大型项目的过程中，Composables（组合式函数）已经成为代码复用和逻辑抽象的核心手段。相比于 Vue 2 时代的 Mixins，Composables 提供了更好的类型推断、更清晰的数据来源追踪，以及更灵活的组合方式。

本文将结合实际项目经验，分享一些 Composables 的设计模式和最佳实践。

## 设计原则

### 1. 单一职责原则

每个 Composable 应该只做一件事，并且把它做好。

```typescript
// Bad: 职责过多
function useUser() {
  const user = ref(null)
  const posts = ref([])
  const friends = ref([])

  async function fetchUser() { /* ... */ }
  async function fetchPosts() { /* ... */ }
  async function fetchFriends() { /* ... */ }

  return { user, posts, friends, fetchUser, fetchPosts, fetchFriends }
}

// Good: 职责单一
function useUser() {
  const user = ref(null)
  const loading = ref(false)

  async function fetchUser(id: string) {
    loading.value = true
    try {
      user.value = await api.getUser(id)
    } finally {
      loading.value = false
    }
  }

  return { user, loading, fetchUser }
}
```

### 2. 输入输出明确

Composable 的参数和返回值应该类型明确，便于使用者理解和 IDE 提示。

```typescript
interface UseCounterOptions {
  min?: number
  max?: number
  step?: number
}

interface UseCounterReturn {
  count: Ref<number>
  increment: () => void
  decrement: () => void
  reset: () => void
}

function useCounter(
  initialValue = 0,
  options: UseCounterOptions = {}
): UseCounterReturn {
  const { min = -Infinity, max = Infinity, step = 1 } = options
  const count = ref(initialValue)

  function increment() {
    count.value = Math.min(count.value + step, max)
  }

  function decrement() {
    count.value = Math.max(count.value - step, min)
  }

  function reset() {
    count.value = initialValue
  }

  return { count, increment, decrement, reset }
}
```

### 3. 支持响应式参数

允许传入 ref 或 getter 作为参数，增加灵活性。

```typescript
import { toValue, type MaybeRefOrGetter } from 'vue'

function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(toValue(url))
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  // 监听 URL 变化自动重新请求
  watch(() => toValue(url), execute, { immediate: true })

  return { data, error, loading, execute }
}

// 使用方式
const userId = ref('1')
const { data } = useFetch(() => `/api/users/${userId.value}`)
// 修改 userId 会自动触发新的请求
```

## 常见模式

### 状态管理模式

对于需要跨组件共享的状态，可以使用模块级别的响应式变量。

```typescript
// useAuth.ts
const user = ref<User | null>(null)
const token = ref<string | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)

  async function login(credentials: Credentials) {
    const response = await api.login(credentials)
    user.value = response.user
    token.value = response.token
    localStorage.setItem('token', response.token)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  // 初始化时从 localStorage 恢复
  function init() {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
      // 验证 token 并获取用户信息
      api.getMe().then(u => user.value = u).catch(logout)
    }
  }

  return { user, token, isAuthenticated, login, logout, init }
}
```

### 副作用清理模式

确保在组件卸载时清理副作用，避免内存泄漏。

```typescript
function useEventListener<K extends keyof WindowEventMap>(
  target: Window,
  event: K,
  callback: (e: WindowEventMap[K]) => void
) {
  onMounted(() => {
    target.addEventListener(event, callback)
  })

  onUnmounted(() => {
    target.removeEventListener(event, callback)
  })
}

function useInterval(callback: () => void, interval: number) {
  const timer = ref<number>()

  function start() {
    stop()
    timer.value = window.setInterval(callback, interval)
  }

  function stop() {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = undefined
    }
  }

  onMounted(start)
  onUnmounted(stop)

  return { start, stop }
}
```

### 异步状态模式

统一处理异步操作的 loading、error、data 状态。

```typescript
function useAsyncState<T>(
  asyncFn: () => Promise<T>,
  initialValue: T,
  options: { immediate?: boolean } = {}
) {
  const { immediate = true } = options

  const state = ref(initialValue) as Ref<T>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function execute() {
    loading.value = true
    error.value = null

    try {
      state.value = await asyncFn()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  if (immediate) {
    execute()
  }

  return {
    state,
    loading,
    error,
    execute
  }
}

// 使用
const { state: users, loading, error } = useAsyncState(
  () => api.getUsers(),
  []
)
```

## 实战案例：表单处理

结合以上模式，实现一个通用的表单处理 Composable。

```typescript
interface UseFormOptions<T> {
  initialValues: T
  validate?: (values: T) => Record<string, string>
  onSubmit: (values: T) => Promise<void>
}

function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
  const { initialValues, validate, onSubmit } = options

  const values = reactive({ ...initialValues }) as T
  const errors = reactive<Record<string, string>>({})
  const touched = reactive<Record<string, boolean>>({})
  const submitting = ref(false)

  const isValid = computed(() => {
    if (!validate) return true
    const validationErrors = validate(values)
    return Object.keys(validationErrors).length === 0
  })

  function setFieldValue<K extends keyof T>(field: K, value: T[K]) {
    values[field] = value
    touched[field as string] = true

    if (validate) {
      const validationErrors = validate(values)
      errors[field as string] = validationErrors[field as string] || ''
    }
  }

  function reset() {
    Object.assign(values, initialValues)
    Object.keys(errors).forEach(key => delete errors[key])
    Object.keys(touched).forEach(key => delete touched[key])
  }

  async function handleSubmit() {
    if (validate) {
      const validationErrors = validate(values)
      Object.assign(errors, validationErrors)

      if (Object.keys(validationErrors).length > 0) {
        return
      }
    }

    submitting.value = true
    try {
      await onSubmit(values)
      reset()
    } finally {
      submitting.value = false
    }
  }

  return {
    values,
    errors,
    touched,
    submitting,
    isValid,
    setFieldValue,
    reset,
    handleSubmit
  }
}
```

## 测试建议

Composables 的测试相对简单，因为它们本质上就是普通函数。

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { count } = useCounter()
    expect(count.value).toBe(0)
  })

  it('should increment correctly', () => {
    const { count, increment } = useCounter(0)
    increment()
    expect(count.value).toBe(1)
  })

  it('should respect max limit', () => {
    const { count, increment } = useCounter(9, { max: 10 })
    increment()
    increment()
    expect(count.value).toBe(10)
  })
})
```

## 总结

好的 Composables 设计应该：

1. **职责单一** - 一个 Composable 只做一件事
2. **类型完善** - 输入输出都有明确的类型定义
3. **灵活可配** - 支持响应式参数和可选配置
4. **副作用可控** - 正确处理生命周期和清理工作
5. **易于测试** - 逻辑独立，便于单元测试

掌握这些模式后，你会发现 Vue 3 的组合式 API 能够帮助你写出更加清晰、可维护的代码。

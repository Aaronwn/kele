---
title: TypeScript 在 Vue 3 项目中的实践指南
description: 从基础到实战，掌握 Vue 3 + TypeScript 开发的最佳实践
date: 2024-11-20
lang: zh
duration: 20min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

在 Vue 3 项目中使用 TypeScript 已经成为主流选择，它能带来更好的类型安全和开发体验。但对于很多开发者来说，如何在实际项目中正确使用 TypeScript 仍然是一个挑战。

本文专为 **TypeScript 基础薄弱但想在 Vue 3 项目中用好 TS 的开发者**准备，将从必备的基础语法讲起，重点讲解 Vue 3 开发中的实际应用场景，包括组件类型定义、API 封装、状态管理等常见场景的类型编写模式。

## TypeScript 基础语法速览

在深入 Vue 3 实践之前，先快速了解必备的 TypeScript 基础知识。如果你已经熟悉这些概念，可以直接跳到下一章节。

### 基础类型

```typescript
// 基本类型
const name: string = 'Vue'
const age: number = 3
const isActive: boolean = true

// 数组类型
const numbers: number[] = [1, 2, 3]
const users: Array<User> = []

// 对象类型
const user: { name: string; age: number } = {
  name: 'John',
  age: 25
}

// 联合类型（表示多种可能的值）
let status: 'pending' | 'success' | 'error' = 'pending'

// 任意类型（尽量避免使用）
let data: any = { foo: 'bar' }
```

### 接口和类型别名

接口（Interface）和类型别名（Type）是定义复杂类型的两种方式：

```typescript
// 接口：定义对象结构
interface User {
  id: number
  name: string
  email?: string  // ? 表示可选属性
  readonly createdAt: Date  // readonly 表示只读
}

// 类型别名：给类型起个名字
type UserId = number | string
type Status = 'pending' | 'success' | 'error'
type UserList = User[]

// 接口 vs 类型别名的选择：
// - 定义对象结构时优先用 interface
// - 定义联合类型、交叉类型时用 type
// - 两者大多数情况可以互换
```

### 函数类型

函数是最常用的类型场景，需要定义参数类型和返回值类型：

```typescript
// 函数声明：指定参数和返回值类型
function getUser(id: number): User {
  return { id, name: 'John', createdAt: new Date() }
}

// 箭头函数
const updateUser = (id: number, data: Partial<User>): Promise<User> => {
  return fetch(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }).then(res => res.json())
}

// 可选参数（用 ?）
function fetchUsers(page: number, size?: number): User[] {
  // ...
}

// 默认参数
function fetchUsers2(page: number = 1, size: number = 10): User[] {
  // ...
}

// 函数类型作为参数
function processUsers(users: User[], callback: (user: User) => void) {
  users.forEach(callback)
}
```

### 常用工具类型

TypeScript 提供了一些内置的工具类型，用于从现有类型派生新类型：

```typescript
interface User {
  id: number
  name: string
  email: string
  password: string
}

// Partial<T> - 将所有属性变为可选
type PartialUser = Partial<User>
// { id?: number; name?: string; email?: string; password?: string }

// Pick<T, K> - 从类型中选取部分属性
type UserBasic = Pick<User, 'id' | 'name'>
// { id: number; name: string }

// Omit<T, K> - 从类型中排除部分属性
type UserWithoutPassword = Omit<User, 'password'>
// { id: number; name: string; email: string }

// Record<K, T> - 创建键值对类型
type UserMap = Record<string, User>
// { [key: string]: User }

// Required<T> - 将所有属性变为必填
type RequiredUser = Required<PartialUser>
```

以上是 Vue 3 开发必备的 TypeScript 基础，后续章节会在实际案例中详细讲解应用场景。

## Vue 3 组件的 TypeScript 实践

### Props 类型定义

在 Vue 3 的 `<script setup>` 中，使用 `defineProps` 定义组件的 Props 类型：

```vue
<script setup lang="ts">
// 方式1：使用类型参数（推荐）
interface Props {
  title: string        // 必填
  count?: number       // 可选
  items: string[]      // 数组
  user: User           // 复杂对象
}

const props = defineProps<Props>()

// 访问 props
console.log(props.title)
console.log(props.count)  // number | undefined
</script>
```

**带默认值的 Props**：

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  theme?: 'light' | 'dark'
}

// 使用 withDefaults 提供默认值
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  theme: 'light'
})

// 现在 props.count 的类型是 number（不再是 number | undefined）
console.log(props.count)  // 类型: number
</script>
```

**复杂 Props 示例**：

```vue
<script setup lang="ts">
// 用户信息接口
interface User {
  id: number
  name: string
  email: string
}

// 列表配置接口
interface ListConfig {
  pageSize: number
  showPagination: boolean
  sortable?: boolean
}

interface Props {
  users: User[]                    // 对象数组
  config: ListConfig               // 复杂对象
  onUpdate?: (user: User) => void  // 函数类型
  status: 'loading' | 'success' | 'error'  // 字面量联合类型
}

const props = defineProps<Props>()

// 类型安全的使用
props.users.forEach(user => {
  console.log(user.name)  // ✓ TypeScript 知道 user 有 name 属性
})
</script>
```

### Emits 类型定义

使用 `defineEmits` 定义组件触发的事件及其参数类型：

```vue
<script setup lang="ts">
// 定义事件类型
interface Emits {
  // 事件名: 参数类型数组
  (e: 'update', value: number): void
  (e: 'delete', id: number): void
  (e: 'change', user: User): void
  (e: 'close'): void  // 无参数事件
}

const emit = defineEmits<Emits>()

// 类型安全的事件触发
function handleClick() {
  emit('update', 100)        // ✓ 正确
  emit('update', '100')      // ✗ 错误：参数类型不匹配
  emit('delete', 1)          // ✓ 正确
  emit('close')              // ✓ 正确
}
</script>
```

**简化写法**：

```vue
<script setup lang="ts">
// 如果事件比较简单，可以直接写
const emit = defineEmits<{
  update: [value: number]          // 数组形式
  delete: [id: number]
  change: [user: User]
  close: []                        // 无参数
}>()

// 使用方式相同
emit('update', 100)
</script>
```

### 完整组件示例

结合 Props、Emits、ref、computed 的完整组件：

```vue
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>Email: {{ user.email }}</p>
    <p>Status: {{ statusText }}</p>

    <button @click="handleUpdate">Update Count</button>
    <button @click="handleDelete">Delete</button>

    <input v-model="searchQuery" placeholder="Search..." />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 类型定义
interface User {
  id: number
  name: string
  email: string
}

interface Props {
  user: User
  count: number
  status: 'active' | 'inactive'
}

interface Emits {
  (e: 'update', newCount: number): void
  (e: 'delete', userId: number): void
}

// Props 和 Emits
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ref：需要显式指定类型
const searchQuery = ref<string>('')
const loading = ref<boolean>(false)

// computed：类型自动推断
const statusText = computed(() => {
  return props.status === 'active' ? '活跃' : '未激活'
})

// 函数：明确参数和返回值类型
function handleUpdate(): void {
  emit('update', props.count + 1)
}

function handleDelete(): void {
  emit('delete', props.user.id)
}
</script>
```

## Composition API 类型实践

### ref 和 reactive

`ref` 和 `reactive` 是 Vue 3 中最常用的响应式 API，理解它们的类型定义很重要：

```typescript
import { ref, reactive, Ref } from 'vue'

// ref：基础类型
const count = ref(0)           // Ref<number>
const name = ref('Vue')        // Ref<string>
const isActive = ref(false)    // Ref<boolean>

// ref：显式指定类型（当初始值为 null 或 undefined 时必须）
const user = ref<User | null>(null)  // Ref<User | null>
const data = ref<string>()           // Ref<string | undefined>

// 访问和修改 ref 的值
console.log(count.value)  // 0
count.value = 10          // 修改值

// reactive：对象类型
interface State {
  count: number
  user: User | null
  items: string[]
}

const state = reactive<State>({
  count: 0,
  user: null,
  items: []
})

// reactive 不需要 .value
console.log(state.count)  // 0
state.count = 10          // 直接修改

// 注意：reactive 只能用于对象，不能用于基础类型
const num = reactive(0)  // ✗ 错误
```

**ref vs reactive 的选择**：

```typescript
// 推荐：基础类型用 ref
const count = ref(0)
const name = ref('Vue')

// 推荐：对象类型也可以用 ref（更灵活）
const user = ref<User>({ id: 1, name: 'John' })

// 或使用 reactive
const user2 = reactive<User>({ id: 1, name: 'John' })

// 实际开发中：
// - 单个值用 ref
// - 一组相关的状态可以用 reactive
const state = reactive({
  loading: false,
  error: null as Error | null,
  data: null as Data | null
})
```

### computed 和 watch

```typescript
import { ref, computed, watch } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)  // ComputedRef<number>

// computed 会自动推断类型
const userInfo = computed(() => {
  return {
    name: 'John',
    age: 25
  }
})  // ComputedRef<{ name: string; age: number }>

// 显式指定 computed 类型（通常不需要）
const triple = computed<number>(() => count.value * 3)

// watch：监听单个值
watch(count, (newVal, oldVal) => {
  // newVal 和 oldVal 的类型自动推断为 number
  console.log(newVal, oldVal)
})

// watch：监听多个值
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  // 类型自动推断
  console.log(newCount, newName)
})

// watch：监听 reactive 对象的属性
const state = reactive({ count: 0, name: 'Vue' })

watch(
  () => state.count,  // getter 函数
  (newVal) => {
    console.log(newVal)  // number
  }
)
```

## API 请求的类型定义

在 Vue 3 项目中，API 请求的类型定义是保证类型安全的关键环节。

### 统一的 API 响应类型

首先定义统一的响应结构：

```typescript
// types/api.ts

// 成功响应
interface ApiSuccess<T = any> {
  code: 0
  data: T
  message: string
}

// 错误响应
interface ApiError {
  code: number
  data: null
  message: string
}

// 联合类型
type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// 类型守卫函数：判断是否成功
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccess<T> {
  return response.code === 0
}
```

### 定义接口类型

为每个 API 接口定义请求和响应类型：

```typescript
// types/user.ts

// 用户实体
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  createdAt: string
}

// 用户列表响应
export interface UserListResponse {
  list: User[]
  total: number
  page: number
  pageSize: number
}

// 创建用户的请求参数
export interface CreateUserParams {
  name: string
  email: string
  password: string
}

// 更新用户的请求参数（所有字段可选）
export type UpdateUserParams = Partial<Omit<User, 'id' | 'createdAt'>>

// 查询参数
export interface UserQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: 'active' | 'inactive'
}
```

### 封装 axios 请求

```typescript
// utils/request.ts
import axios, { AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 泛型请求函数：T 是 data 的类型
export async function request<T = any>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await instance.request<ApiResponse<T>>(config)
    return response.data
  } catch (error) {
    // 错误处理
    return {
      code: -1,
      data: null,
      message: '请求失败'
    }
  }
}

// 封装常用方法
export function get<T = any>(
  url: string,
  params?: Record<string, any>
): Promise<ApiResponse<T>> {
  return request<T>({ method: 'GET', url, params })
}

export function post<T = any>(
  url: string,
  data?: Record<string, any>
): Promise<ApiResponse<T>> {
  return request<T>({ method: 'POST', url, data })
}

export function put<T = any>(
  url: string,
  data?: Record<string, any>
): Promise<ApiResponse<T>> {
  return request<T>({ method: 'PUT', url, data })
}

export function del<T = any>(
  url: string
): Promise<ApiResponse<T>> {
  return request<T>({ method: 'DELETE', url })
}
```

### API 模块

将具体的 API 封装成函数：

```typescript
// api/user.ts
import { get, post, put, del } from '@/utils/request'
import type {
  User,
  UserListResponse,
  CreateUserParams,
  UpdateUserParams,
  UserQueryParams
} from '@/types/user'
import type { ApiResponse } from '@/types/api'

// 获取用户列表
export function getUserList(
  params: UserQueryParams
): Promise<ApiResponse<UserListResponse>> {
  return get<UserListResponse>('/users', params)
}

// 获取单个用户
export function getUser(id: number): Promise<ApiResponse<User>> {
  return get<User>(`/users/${id}`)
}

// 创建用户
export function createUser(
  data: CreateUserParams
): Promise<ApiResponse<User>> {
  return post<User>('/users', data)
}

// 更新用户
export function updateUser(
  id: number,
  data: UpdateUserParams
): Promise<ApiResponse<User>> {
  return put<User>(`/users/${id}`, data)
}

// 删除用户
export function deleteUser(id: number): Promise<ApiResponse<void>> {
  return del<void>(`/users/${id}`)
}
```

### 在组件中使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { getUserList } from '@/api/user'
import { isApiSuccess } from '@/types/api'
import type { User, UserQueryParams } from '@/types/user'

// 状态
const users = ref<User[]>([])
const loading = ref(false)
const total = ref(0)

// 查询参数
const queryParams: UserQueryParams = {
  page: 1,
  pageSize: 10,
  keyword: ''
}

// 获取用户列表
async function fetchUsers() {
  loading.value = true

  try {
    const response = await getUserList(queryParams)

    // 类型守卫
    if (isApiSuccess(response)) {
      users.value = response.data.list
      total.value = response.data.total
      // TypeScript 知道 response.data 的类型是 UserListResponse
    } else {
      console.error(response.message)
    }
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
fetchUsers()
</script>
```

## 状态管理（Pinia）

Pinia 对 TypeScript 的支持非常好，类型推断几乎是自动的。

### 定义 Store

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/user'
import { getUser } from '@/api/user'
import { isApiSuccess } from '@/types/api'

export const useUserStore = defineStore('user', () => {
  // state
  const currentUser = ref<User | null>(null)
  const token = ref<string>('')
  const loading = ref(false)

  // getters（计算属性）
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => currentUser.value?.name ?? '游客')

  // actions
  async function fetchUserInfo(userId: number): Promise<boolean> {
    loading.value = true

    try {
      const response = await getUser(userId)

      if (isApiSuccess(response)) {
        currentUser.value = response.data
        return true
      }
      return false
    } finally {
      loading.value = false
    }
  }

  function login(userToken: string, user: User): void {
    token.value = userToken
    currentUser.value = user
  }

  function logout(): void {
    token.value = ''
    currentUser.value = null
  }

  return {
    // state
    currentUser,
    token,
    loading,
    // getters
    isLoggedIn,
    userName,
    // actions
    fetchUserInfo,
    login,
    logout
  }
})
```

### 在组件中使用 Store

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user'

// 获取 store 实例
const userStore = useUserStore()

// 访问 state（类型自动推断）
console.log(userStore.currentUser)  // User | null
console.log(userStore.token)        // string

// 访问 getters
console.log(userStore.isLoggedIn)   // boolean
console.log(userStore.userName)     // string

// 调用 actions
async function handleLogin() {
  const success = await userStore.fetchUserInfo(1)
  if (success) {
    console.log('登录成功')
  }
}

// 使用 storeToRefs 保持响应性
import { storeToRefs } from 'pinia'

const { currentUser, isLoggedIn } = storeToRefs(userStore)
// currentUser 和 isLoggedIn 保持响应式
</script>
```

## 实战案例

### 案例 1：用户列表组件

这个案例展示如何在实际组件中综合运用 TypeScript：

```vue
<template>
  <div class="user-list">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        v-model="searchKeyword"
        placeholder="搜索用户..."
        @input="handleSearch"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- 用户列表 -->
    <div v-else class="user-items">
      <UserCard
        v-for="user in users"
        :key="user.id"
        :user="user"
        @update="handleUpdateUser"
        @delete="handleDeleteUser"
      />
    </div>

    <!-- 分页 -->
    <Pagination
      v-model:page="currentPage"
      :total="total"
      :page-size="pageSize"
      @change="fetchUsers"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUserList, deleteUser } from '@/api/user'
import { isApiSuccess } from '@/types/api'
import type { User, UserQueryParams } from '@/types/user'
import UserCard from './UserCard.vue'
import Pagination from './Pagination.vue'

// ========== 接口定义（重点） ==========

// Props 接口
interface Props {
  initialPage?: number
  initialPageSize?: number
}

// Emits 接口
interface Emits {
  (e: 'userUpdated', user: User): void
  (e: 'userDeleted', userId: number): void
}

const props = withDefaults(defineProps<Props>(), {
  initialPage: 1,
  initialPageSize: 10
})

const emit = defineEmits<Emits>()

// ========== 状态定义 ==========

const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string>('')
const total = ref(0)
const currentPage = ref(props.initialPage)
const pageSize = ref(props.initialPageSize)
const searchKeyword = ref('')

// ========== 函数定义（重点：参数类型和返回值类型） ==========

/**
 * 获取用户列表
 * @returns Promise<void> - 异步函数返回类型
 */
async function fetchUsers(): Promise<void> {
  loading.value = true
  error.value = ''

  // 查询参数：符合 UserQueryParams 接口
  const params: UserQueryParams = {
    page: currentPage.value,
    pageSize: pageSize.value,
    keyword: searchKeyword.value
  }

  try {
    const response = await getUserList(params)

    if (isApiSuccess(response)) {
      users.value = response.data.list
      total.value = response.data.total
    } else {
      error.value = response.message
    }
  } catch (err) {
    error.value = '请求失败，请稍后重试'
    console.error(err)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索处理
 */
function handleSearch(): void {
  currentPage.value = 1
  fetchUsers()
}

/**
 * 更新用户处理
 * @param user - 更新后的用户对象
 */
function handleUpdateUser(user: User): void {
  // 更新本地列表
  const index = users.value.findIndex(u => u.id === user.id)
  if (index !== -1) {
    users.value[index] = user
  }

  // 触发事件
  emit('userUpdated', user)
}

/**
 * 删除用户处理
 * @param userId - 要删除的用户 ID
 */
async function handleDeleteUser(userId: number): Promise<void> {
  if (!confirm('确认删除该用户吗？')) {
    return
  }

  loading.value = true

  try {
    const response = await deleteUser(userId)

    if (isApiSuccess(response)) {
      // 从列表中移除
      users.value = users.value.filter(u => u.id !== userId)
      total.value--

      // 触发事件
      emit('userDeleted', userId)
    } else {
      alert(response.message)
    }
  } catch (err) {
    alert('删除失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}

// ========== 生命周期 ==========

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
/* 样式省略 */
</style>
```

**这个案例中的 TypeScript 知识点**：

1. **接口定义**：`User`、`UserQueryParams`、`Props`、`Emits`
2. **可选属性**：`Props` 中的 `?`
3. **函数参数类型**：`handleUpdateUser(user: User)`
4. **函数返回值类型**：`Promise<void>`
5. **数组类型**：`ref<User[]>([])` 6. **联合类型**：`error.value` 可以是 `string` 或空字符串
7. **类型守卫**：`isApiSuccess` 判断响应类型

### 案例 2：封装 Composable

Composables 是 Vue 3 中复用逻辑的最佳方式，下面演示如何编写类型安全的 composable：

```typescript
// composables/useRequest.ts
import { ref, unref } from 'vue'
import type { Ref } from 'vue'

// ========== 接口定义 ==========

// 请求选项
interface UseRequestOptions<T> {
  immediate?: boolean  // 是否立即执行
  initialData?: T      // 初始数据
  onSuccess?: (data: T) => void  // 成功回调
  onError?: (error: Error) => void  // 错误回调
}

// 返回值类型
interface UseRequestReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  run: (...args: any[]) => Promise<void>
  refresh: () => Promise<void>
}

// ========== 泛型函数定义（重点） ==========

/**
 * 封装异步请求逻辑
 * @param requestFn - 请求函数
 * @param options - 配置选项
 * @returns 请求状态和方法
 */
export function useRequest<T = any>(
  requestFn: (...args: any[]) => Promise<T>,
  options: UseRequestOptions<T> = {}
): UseRequestReturn<T> {

  // 解构选项（带默认值）
  const {
    immediate = false,
    initialData = null,
    onSuccess,
    onError
  } = options

  // 状态
  const data = ref<T | null>(initialData)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // 保存最后一次调用的参数
  let lastArgs: any[] = []

  /**
   * 执行请求
   * @param args - 请求参数
   */
  async function run(...args: any[]): Promise<void> {
    lastArgs = args
    loading.value = true
    error.value = null

    try {
      const result = await requestFn(...args)
      data.value = result
      onSuccess?.(result)  // 可选链调用
    } catch (err) {
      error.value = err as Error
      onError?.(err as Error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 使用上次参数重新请求
   */
  async function refresh(): Promise<void> {
    await run(...lastArgs)
  }

  // 立即执行
  if (immediate) {
    run()
  }

  return {
    data,
    loading,
    error,
    run,
    refresh
  }
}
```

**在组件中使用**：

```vue
<script setup lang="ts">
import { useRequest } from '@/composables/useRequest'
import { getUserList } from '@/api/user'
import type { UserListResponse, UserQueryParams } from '@/types/user'

// 使用 useRequest 封装 API 请求
const {
  data: userListData,
  loading,
  error,
  run: fetchUsers,
  refresh
} = useRequest<UserListResponse>(
  // 请求函数（需要返回 Promise<UserListResponse>）
  (params: UserQueryParams) => {
    return getUserList(params).then(res => {
      if (isApiSuccess(res)) {
        return res.data
      }
      throw new Error(res.message)
    })
  },
  // 选项
  {
    immediate: true,
    onSuccess: (data) => {
      console.log('获取成功', data.list.length)
    },
    onError: (err) => {
      console.error('获取失败', err.message)
    }
  }
)

// 搜索
function handleSearch(keyword: string) {
  fetchUsers({ page: 1, pageSize: 10, keyword })
}

// 刷新
function handleRefresh() {
  refresh()
}
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error.message }}</div>
    <div v-else-if="userListData">
      <!-- userListData 的类型是 UserListResponse -->
      <div v-for="user in userListData.list" :key="user.id">
        {{ user.name }}
      </div>
    </div>
  </div>
</template>
```

**这个案例中的 TypeScript 知识点**：

1. **泛型函数**：`useRequest<T>`
2. **函数类型参数**：`requestFn: (...args: any[]) => Promise<T>`
3. **接口定义**：`UseRequestOptions`、`UseRequestReturn`
4. **Ref 类型**：`Ref<T | null>`
5. **可选属性**：`immediate?`
6. **函数类型**：`onSuccess?: (data: T) => void`
7. **可选链**：`onSuccess?.(result)`
8. **类型断言**：`err as Error`

### 案例 3：表单处理

表单是前端开发中最常见的场景，下面展示如何用 TypeScript 处理表单：

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-item">
      <label>用户名</label>
      <input
        v-model="formData.name"
        @blur="() => validateField('name')"
      />
      <span v-if="errors.name" class="error">{{ errors.name }}</span>
    </div>

    <div class="form-item">
      <label>邮箱</label>
      <input
        v-model="formData.email"
        type="email"
        @blur="() => validateField('email')"
      />
      <span v-if="errors.email" class="error">{{ errors.email }}</span>
    </div>

    <div class="form-item">
      <label>密码</label>
      <input
        v-model="formData.password"
        type="password"
        @blur="() => validateField('password')"
      />
      <span v-if="errors.password" class="error">{{ errors.password }}</span>
    </div>

    <button type="submit" :disabled="submitting">
      {{ submitting ? '提交中...' : '提交' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createUser } from '@/api/user'
import type { CreateUserParams } from '@/types/user'
import { isApiSuccess } from '@/types/api'

// ========== 类型定义 ==========

// 表单数据类型
interface FormData {
  name: string
  email: string
  password: string
}

// 表单错误类型（映射类型）
type FormErrors = {
  [K in keyof FormData]?: string
}

// 验证规则类型
type ValidationRule = (value: string) => string | undefined

// 验证规则集合类型
type ValidationRules = {
  [K in keyof FormData]?: ValidationRule[]
}

// ========== 状态 ==========

const formData = reactive<FormData>({
  name: '',
  email: '',
  password: ''
})

const errors = reactive<FormErrors>({})
const submitting = ref(false)

// ========== 验证规则 ==========

const rules: ValidationRules = {
  name: [
    (value) => value ? undefined : '请输入用户名',
    (value) => value.length >= 2 ? undefined : '用户名至少2个字符'
  ],
  email: [
    (value) => value ? undefined : '请输入邮箱',
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? undefined
      : '邮箱格式不正确'
  ],
  password: [
    (value) => value ? undefined : '请输入密码',
    (value) => value.length >= 6 ? undefined : '密码至少6个字符'
  ]
}

// ========== 验证函数 ==========

/**
 * 验证单个字段
 * @param field - 字段名（类型安全）
 */
function validateField(field: keyof FormData): boolean {
  const fieldRules = rules[field]
  const value = formData[field]

  if (!fieldRules) {
    return true
  }

  // 执行所有验证规则
  for (const rule of fieldRules) {
    const errorMessage = rule(value)
    if (errorMessage) {
      errors[field] = errorMessage
      return false
    }
  }

  // 验证通过，清除错误
  errors[field] = undefined
  return true
}

/**
 * 验证所有字段
 */
function validateForm(): boolean {
  let isValid = true

  // keyof FormData 确保遍历所有字段
  for (const field of Object.keys(formData) as Array<keyof FormData>) {
    if (!validateField(field)) {
      isValid = false
    }
  }

  return isValid
}

/**
 * 提交表单
 */
async function handleSubmit(): Promise<void> {
  // 验证表单
  if (!validateForm()) {
    return
  }

  submitting.value = true

  try {
    // formData 符合 CreateUserParams 类型
    const params: CreateUserParams = {
      name: formData.name,
      email: formData.email,
      password: formData.password
    }

    const response = await createUser(params)

    if (isApiSuccess(response)) {
      alert('创建成功')
      // 重置表单
      Object.assign(formData, { name: '', email: '', password: '' })
      Object.assign(errors, {})
    } else {
      alert(response.message)
    }
  } catch (err) {
    alert('提交失败')
    console.error(err)
  } finally {
    submitting.value = false
  }
}
</script>
```

**这个案例中的 TypeScript 知识点**：

1. **映射类型**：`type FormErrors = { [K in keyof FormData]?: string }`
2. **keyof 操作符**：获取接口的所有键
3. **函数类型**：`ValidationRule = (value: string) => string | undefined`
4. **类型安全的对象遍历**：`Object.keys(formData) as Array<keyof FormData>`
5. **联合类型的返回值**：`string | undefined`

## 常见问题和最佳实践

### 1. 什么时候需要显式指定类型？

```typescript
// 需要显式指定类型的情况：

// ✓ ref 初始值为 null 或 undefined
const user = ref<User | null>(null)
const data = ref<string>()

// ✓ 空数组（无法推断元素类型）
const users = ref<User[]>([])

// ✗ 不需要：TypeScript 可以推断
const count = ref(0)  // 推断为 Ref<number>
const name = ref('Vue')  // 推断为 Ref<string>
const user = reactive({ name: 'John', age: 25 })  // 类型推断
```

### 2. interface vs type 如何选择？

```typescript
// 推荐：对象类型用 interface
interface User {
  id: number
  name: string
}

// 推荐：联合类型、交叉类型、工具类型用 type
type Status = 'pending' | 'success' | 'error'
type Result = User & { token: string }
type PartialUser = Partial<User>

// 两者大多数情况可以互换，选择团队统一的风格即可
```

### 3. 避免使用 any

```typescript
// ✗ 不好：失去类型检查
function processData(data: any) {
  return data.map(item => item.name)  // 不安全
}

// ✓ 好：使用泛型
function processData<T extends { name: string }>(data: T[]) {
  return data.map(item => item.name)  // 类型安全
}

// ✓ 或使用 unknown（需要类型收窄）
function processData(data: unknown) {
  if (Array.isArray(data)) {
    // 这里可以安全使用
  }
}
```

### 4. Props 默认值的类型问题

```typescript
// ✗ 错误写法
interface Props {
  count: number  // 必填，但提供了默认值
}
const props = withDefaults(defineProps<Props>(), {
  count: 0  // 类型冲突
})

// ✓ 正确写法
interface Props {
  count?: number  // 可选
}
const props = withDefaults(defineProps<Props>(), {
  count: 0  // ✓ 正确
})
```

### 5. 类型断言要谨慎使用

```typescript
// ✗ 不好：盲目断言可能导致运行时错误
const data = response.data as User[]  // 如果实际不是 User[] 会出错

// ✓ 好：使用类型守卫
function isUserArray(data: unknown): data is User[] {
  return Array.isArray(data) && data.every(item =>
    typeof item === 'object' &&
    'id' in item &&
    'name' in item
  )
}

if (isUserArray(response.data)) {
  // 安全使用
}
```

### 6. 善用工具类型

```typescript
// 利用工具类型减少重复定义

interface User {
  id: number
  name: string
  email: string
  password: string
  createdAt: Date
}

// 创建用户：不需要 id 和 createdAt
type CreateUserInput = Omit<User, 'id' | 'createdAt'>

// 更新用户：所有字段可选，但排除 id 和 createdAt
type UpdateUserInput = Partial<Omit<User, 'id' | 'createdAt'>>

// 公开用户信息：排除敏感字段
type PublicUser = Omit<User, 'password'>
```

## 总结

通过本文，我们系统学习了在 Vue 3 项目中使用 TypeScript 的最佳实践：

1. **基础语法**：掌握接口定义、函数类型、工具类型等基础概念
2. **组件类型**：正确使用 `defineProps` 和 `defineEmits` 定义组件接口
3. **Composition API**：理解 `ref`、`reactive`、`computed` 的类型推断
4. **API 封装**：使用泛型函数封装类型安全的 HTTP 请求
5. **状态管理**：在 Pinia 中充分利用类型推断
6. **实战案例**：通过完整示例学习实际开发中的类型编写模式

**关键要点**：

- ✅ 优先使用类型推断，减少显式类型声明
- ✅ 为 API 接口、组件 Props 等边界定义清晰的类型
- ✅ 善用工具类型（Partial、Pick、Omit 等）减少重复
- ✅ 避免使用 `any`，必要时使用 `unknown` + 类型守卫
- ✅ 渐进式增强，从简单类型开始逐步完善

TypeScript 不是负担，而是帮助我们写出更健壮代码的工具。在 Vue 3 项目中正确使用 TypeScript，可以显著提升开发体验和代码质量。

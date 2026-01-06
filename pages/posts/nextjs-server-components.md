---
title: Next.js Server Components 深度解析
description: 从原理到实践，全面理解 React Server Components 在 Next.js 中的应用
date: 2024-12-10T10:00:00.000+00:00
lang: zh
duration: 20min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

React Server Components (RSC) 是 React 生态中最重要的架构演进之一。Next.js 13+ 的 App Router 将 RSC 作为默认范式，彻底改变了我们构建 React 应用的方式。本文将深入探讨 RSC 的原理、使用场景和最佳实践。

## 核心概念

### 服务端组件 vs 客户端组件

```tsx
// 服务端组件（默认）- 在服务器上运行
// app/posts/page.tsx
async function PostsPage() {
  // 可以直接访问数据库、文件系统等
  const posts = await db.posts.findMany()

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

// 客户端组件 - 在浏览器上运行
// components/LikeButton.tsx
'use client'

import { useState } from 'react'

function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false)

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '❤️' : '🤍'}
    </button>
  )
}
```

### 渲染流程

1. **服务端**：执行服务端组件，生成 RSC Payload
2. **传输**：RSC Payload 流式传输到客户端
3. **客户端**：React 使用 Payload 构建组件树，hydrate 客户端组件

```html
服务端组件 → RSC Payload → 客户端解析 → DOM 更新
                ↓
        包含序列化的组件树和 props
```

## 使用场景划分

### 何时使用服务端组件

- 数据获取（直接访问数据库/API）
- 访问敏感信息（API keys、tokens）
- 大型依赖（避免发送到客户端）
- 静态内容渲染

```tsx
// app/dashboard/page.tsx
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

async function DashboardPage() {
  const token = cookies().get('token')?.value
  const user = await verifyToken(token)

  // 直接查询数据库，不暴露连接信息
  const stats = await db.analytics.getStats(user.id)

  return <DashboardView user={user} stats={stats} />
}
```

### 何时使用客户端组件

- 需要交互（onClick、onChange）
- 需要浏览器 API（localStorage、geolocation）
- 需要 React hooks（useState、useEffect、useContext）
- 需要实时更新

```tsx
'use client'

import { useEffect, useState } from 'react'

function LiveNotifications() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const ws = new WebSocket('/api/notifications')
    ws.onmessage = (e) => {
      setNotifications(prev => [...prev, JSON.parse(e.data)])
    }
    return () => ws.close()
  }, [])

  return <NotificationList items={notifications} />
}
```

## 数据获取模式

### 并行数据获取

```tsx
// app/dashboard/page.tsx
async function DashboardPage() {
  // 并行获取，不阻塞
  const [user, posts, analytics] = await Promise.all([
    getUser(),
    getPosts(),
    getAnalytics()
  ])

  return (
    <div>
      <UserInfo user={user} />
      <PostList posts={posts} />
      <AnalyticsChart data={analytics} />
    </div>
  )
}
```

### 流式渲染与 Suspense

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'

async function DashboardPage() {
  return (
    <div>
      {/* 用户信息优先展示 */}
      <Suspense fallback={<UserSkeleton />}>
        <UserSection />
      </Suspense>

      {/* 数据分析可以慢一点加载 */}
      <Suspense fallback={<ChartSkeleton />}>
        <SlowAnalyticsSection />
      </Suspense>
    </div>
  )
}

// 慢速组件独立 Suspense 边界
async function SlowAnalyticsSection() {
  const data = await getSlowAnalytics() // 可能需要几秒
  return <AnalyticsChart data={data} />
}
```

### 请求去重

Next.js 自动对相同请求去重：

```tsx
// 这两个组件的 getUser() 调用会被自动去重
async function Header() {
  const user = await getUser() // 请求 1
  return <nav>{user.name}</nav>
}

async function Sidebar() {
  const user = await getUser() // 复用请求 1 的结果
  return <aside>{user.role}</aside>
}

// 封装数据获取函数
async function getUser() {
  const res = await fetch('/api/user', {
    next: { revalidate: 3600 } // 缓存 1 小时
  })
  return res.json()
}
```

## 组件组合模式

### 服务端组件包裹客户端组件

```tsx
// app/post/[id]/page.tsx (Server Component)
async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      {/* 客户端组件接收序列化数据 */}
      <CommentSection postId={params.id} initialComments={post.comments} />
    </article>
  )
}

// components/CommentSection.tsx
'use client'

function CommentSection({
  postId,
  initialComments
}: {
  postId: string
  initialComments: Comment[]
}) {
  const [comments, setComments] = useState(initialComments)
  // 交互逻辑...
}
```

### 客户端组件中使用服务端组件

通过 children 或 props 传递服务端组件：

```tsx
// components/Modal.tsx
'use client'

function Modal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>打开</button>
      {open && (
        <div className="modal">
          {children} {/* 可以是服务端组件 */}
        </div>
      )}
    </>
  )
}

// app/page.tsx (Server Component)
async function Page() {
  return (
    <Modal>
      <ServerContent /> {/* 服务端组件作为 children */}
    </Modal>
  )
}

async function ServerContent() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

## 常见陷阱

### 1. 错误的组件边界

```tsx
// ❌ 错误：在服务端组件中使用 hooks
async function BadComponent() {
  const [state, setState] = useState(0) // Error!
  const data = await fetchData()
  return <div>{data}</div>
}

// ✅ 正确：分离交互逻辑
async function GoodComponent() {
  const data = await fetchData()
  return <InteractiveWrapper data={data} />
}

// components/InteractiveWrapper.tsx
'use client'
function InteractiveWrapper({ data }) {
  const [state, setState] = useState(0)
  return <div onClick={() => setState(s => s + 1)}>{data}</div>
}
```

### 2. Props 序列化

```tsx
// ❌ 错误：传递不可序列化的值
async function Parent() {
  const handler = () => console.log('click') // 函数不可序列化
  return <ClientChild onClick={handler} />
}

// ✅ 正确：在客户端组件内定义函数
async function Parent() {
  const data = await getData()
  return <ClientChild data={data} />
}

'use client'
function ClientChild({ data }) {
  const handleClick = () => console.log(data)
  return <button onClick={handleClick}>Click</button>
}
```

### 3. 过度使用 'use client'

```tsx
// ❌ 不好：整个页面都变成客户端组件
'use client'

export default function Page() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <Header /> {/* 本可以是服务端组件 */}
      <StaticContent /> {/* 本可以是服务端组件 */}
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {open && <Modal />}
    </div>
  )
}

// ✅ 好：最小化客户端边界
export default function Page() {
  return (
    <div>
      <Header /> {/* 服务端组件 */}
      <StaticContent /> {/* 服务端组件 */}
      <ToggleButton /> {/* 仅这个是客户端组件 */}
    </div>
  )
}
```

## 缓存策略

### 数据缓存

```tsx
// 静态数据 - 构建时缓存
async function getStaticData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'force-cache'
  })
  return res.json()
}

// 动态数据 - 每次请求
async function getDynamicData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  })
  return res.json()
}

// 增量缓存 - 定时重新验证
async function getRevalidatedData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 } // 60秒后重新验证
  })
  return res.json()
}
```

### 页面缓存

```tsx
// 强制动态渲染
export const dynamic = 'force-dynamic'

// 强制静态渲染
export const dynamic = 'force-static'

// 设置重新验证时间
export const revalidate = 3600 // 1小时
```

## 总结

Server Components 的核心优势：

1. **零 JavaScript 发送** - 服务端组件不增加客户端 bundle
2. **直接数据访问** - 无需 API 层，直接查询数据库
3. **流式渲染** - 配合 Suspense 实现渐进式加载
4. **自动代码分割** - 客户端组件自动懒加载

掌握 RSC 需要转变思维：默认服务端渲染，按需添加客户端交互。这种模式能显著提升应用性能和用户体验。

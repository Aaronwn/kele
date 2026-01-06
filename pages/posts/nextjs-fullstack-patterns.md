---
title: Next.js 全栈开发模式与 API 设计
description: 探索 Next.js App Router 全栈开发的最佳实践和 API 设计模式
date: 2024-10-28T10:00:00.000+00:00
lang: zh
duration: 18min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

Next.js 的 App Router 让前端工程师能够更自然地进行全栈开发。Server Components、Server Actions、Route Handlers 等特性模糊了前后端的边界。本文将分享在 Next.js 中进行全栈开发的模式和经验。

## 项目结构

### 推荐的目录组织

```text
app/
├── (auth)/                    # 路由组：认证相关页面
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/               # 路由组：后台页面
│   ├── layout.tsx            # 带侧边栏的布局
│   ├── page.tsx              # /dashboard
│   └── settings/page.tsx     # /dashboard/settings
├── api/                       # API Routes
│   ├── auth/[...nextauth]/route.ts
│   └── webhooks/stripe/route.ts
├── layout.tsx
└── page.tsx

lib/
├── db/                        # 数据库相关
│   ├── index.ts              # Prisma 客户端
│   ├── schema.prisma
│   └── migrations/
├── actions/                   # Server Actions
│   ├── user.ts
│   └── post.ts
├── services/                  # 业务逻辑层
│   ├── user.service.ts
│   └── post.service.ts
└── validations/              # 数据验证
    ├── user.ts
    └── post.ts

components/
├── ui/                       # 通用 UI 组件
└── features/                 # 业务组件
```

## 数据获取模式

### Server Components 直接查询

```tsx
// app/posts/page.tsx
import { db } from '@/lib/db'

// 这是一个 Server Component，可以直接查询数据库
async function PostsPage() {
  const posts = await db.post.findMany({
    include: { author: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <h1>文章列表</h1>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

export default PostsPage
```

### 带参数的数据查询

```tsx
// app/posts/[id]/page.tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

interface Props {
  params: { id: string }
}

async function PostPage({ params }: Props) {
  const post = await db.post.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!post) {
    notFound()
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>作者: {post.author.name}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      <CommentSection comments={post.comments} postId={post.id} />
    </article>
  )
}

export default PostPage
```

## Server Actions

### 定义 Server Action

```typescript
// lib/actions/post.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 定义输入验证 Schema
const CreatePostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  published: z.boolean().default(false)
})

// 定义返回类型
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createPost(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  // 1. 验证用户登录
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: '请先登录' }
  }

  // 2. 解析和验证输入
  const rawData = {
    title: formData.get('title'),
    content: formData.get('content'),
    published: formData.get('published') === 'true'
  }

  const result = CreatePostSchema.safeParse(rawData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message }
  }

  // 3. 执行数据库操作
  try {
    const post = await db.post.create({
      data: {
        ...result.data,
        authorId: session.user.id
      }
    })

    // 4. 重新验证缓存
    revalidatePath('/posts')

    return { success: true, data: { id: post.id } }
  } catch (error) {
    console.error('Create post error:', error)
    return { success: false, error: '创建失败，请稍后重试' }
  }
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: '请先登录' }
  }

  const post = await db.post.findUnique({ where: { id: postId } })

  if (!post) {
    return { success: false, error: '文章不存在' }
  }

  if (post.authorId !== session.user.id) {
    return { success: false, error: '无权删除此文章' }
  }

  await db.post.delete({ where: { id: postId } })
  revalidatePath('/posts')

  return { success: true }
}
```

### 在客户端组件中使用

```tsx
// components/features/CreatePostForm.tsx
'use client'

import { createPost } from '@/lib/actions/post'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export function CreatePostForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      const result = await createPost(formData)

      if (result.success) {
        router.push(`/posts/${result.data.id}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input name="title" placeholder="标题" required />
      <textarea name="content" placeholder="内容" required />

      <label>
        <input type="checkbox" name="published" value="true" />
        立即发布
      </label>

      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '创建文章'}
      </button>
    </form>
  )
}
```

### 乐观更新

```tsx
// components/features/LikeButton.tsx
'use client'

import { likePost } from '@/lib/actions/post'
import { useOptimistic, useTransition } from 'react'

interface Props {
  postId: string
  initialLikes: number
  isLiked: boolean
}

export function LikeButton({ postId, initialLikes, isLiked }: Props) {
  const [isPending, startTransition] = useTransition()

  const [optimisticState, addOptimistic] = useOptimistic(
    { likes: initialLikes, isLiked },
    (state, newIsLiked: boolean) => ({
      likes: newIsLiked ? state.likes + 1 : state.likes - 1,
      isLiked: newIsLiked
    })
  )

  function handleClick() {
    startTransition(async () => {
      // 立即更新 UI
      addOptimistic(!optimisticState.isLiked)
      // 后台执行实际操作
      await likePost(postId)
    })
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {optimisticState.isLiked ? '❤️' : '🤍'} {optimisticState.likes}
    </button>
  )
}
```

## Route Handlers

### 基础 API 路由

```typescript
// app/api/posts/route.ts
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const posts = await db.post.findMany({
    where: { published: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  })

  const total = await db.post.count({ where: { published: true } })

  return NextResponse.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    // 验证逻辑...

    const post = await db.post.create({
      data: {
        ...body,
        authorId: session.user.id
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

### 动态路由 API

```typescript
// app/api/posts/[id]/route.ts
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface Context {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Context) {
  const post = await db.post.findUnique({
    where: { id: params.id }
  })

  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(post)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  // 更新逻辑...
}

export async function DELETE(request: NextRequest, { params }: Context) {
  // 删除逻辑...
}
```

## 认证集成

### NextAuth.js 配置

```typescript
// lib/auth.ts
import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
```

### 保护页面和 API

```tsx
// app/(dashboard)/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="dashboard-layout">
      <Sidebar user={session.user} />
      <main>{children}</main>
    </div>
  )
}
```

## 错误处理

### 全局错误边界

```tsx
// app/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 上报错误到监控服务
    console.error(error)
  }, [error])

  return (
    <div className="error-page">
      <h2>出错了</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  )
}
```

### Not Found 页面

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="not-found">
      <h2>页面不存在</h2>
      <p>找不到请求的资源</p>
      <Link href="/">返回首页</Link>
    </div>
  )
}
```

## 总结

Next.js 全栈开发的核心模式：

1. **Server Components** - 直接查询数据库，无需 API 层
2. **Server Actions** - 处理表单提交和数据变更
3. **Route Handlers** - 提供 RESTful API 或 Webhook
4. **统一验证** - 使用 Zod 在前后端共享验证逻辑
5. **类型安全** - TypeScript 贯穿全栈

这种模式减少了传统前后端分离的复杂性，让开发者能够更专注于业务逻辑。

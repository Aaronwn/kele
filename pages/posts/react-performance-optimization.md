---
title: React 性能优化实战：从理论到落地
description: 系统总结 React 应用性能优化的方法论和实践经验
date: 2024-12-15T10:00:00.000+00:00
lang: zh
duration: 18min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

性能优化是前端开发中永恒的话题。在 React 应用中，不恰当的组件设计和状态管理往往会导致不必要的重渲染，影响用户体验。本文将从原理出发，结合实际案例，分享 React 性能优化的系统方法。

## 理解 React 渲染机制

### 重渲染触发条件

React 组件会在以下情况触发重渲染：

1. 组件自身的 state 变化
2. 父组件重渲染（默认行为）
3. Context 值变化
4. forceUpdate 调用

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {/* Child 会跟随 Parent 重渲染，即使它不依赖 count */}
      <Child />
    </div>
  )
}
```

### 渲染 vs 提交

React 渲染分为两个阶段：

- **Render 阶段**：调用组件函数，生成虚拟 DOM
- **Commit 阶段**：将变化应用到真实 DOM

重渲染不一定导致 DOM 更新，但 Render 阶段的计算开销仍然存在。

## 优化策略

### 1. 组件记忆化

使用 `React.memo` 避免不必要的子组件重渲染。

```tsx
// 优化前：每次 Parent 渲染都会导致 ExpensiveList 重渲染
function ExpensiveList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{/* 复杂渲染逻辑 */}</li>
      ))}
    </ul>
  )
}

// 优化后：只有 items 真正变化时才重渲染
const MemoizedExpensiveList = React.memo(ExpensiveList)

// 自定义比较函数
const MemoizedList = React.memo(ExpensiveList, (prevProps, nextProps) => {
  // 返回 true 表示 props 相等，不需要重渲染
  return prevProps.items.length === nextProps.items.length &&
    prevProps.items.every((item, i) => item.id === nextProps.items[i].id)
})
```

### 2. 回调函数稳定化

使用 `useCallback` 保持回调函数引用稳定。

```tsx
function SearchForm({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('')

  // Bad: 每次渲染都创建新函数
  const handleSubmit = () => {
    onSearch(query)
  }

  // Good: 只在 query 或 onSearch 变化时创建新函数
  const handleSubmit = useCallback(() => {
    onSearch(query)
  }, [query, onSearch])

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <MemoizedButton onClick={handleSubmit}>搜索</MemoizedButton>
    </form>
  )
}
```

### 3. 计算结果缓存

使用 `useMemo` 避免重复计算。

```tsx
function DataTable({ data, sortKey, filterText }: Props) {
  // Bad: 每次渲染都重新计算
  const processedData = data
    .filter(item => item.name.includes(filterText))
    .sort((a, b) => a[sortKey] - b[sortKey])

  // Good: 只在依赖变化时重新计算
  const processedData = useMemo(() => {
    return data
      .filter(item => item.name.includes(filterText))
      .sort((a, b) => a[sortKey] - b[sortKey])
  }, [data, filterText, sortKey])

  return <Table data={processedData} />
}
```

### 4. 状态下沉

将状态移动到真正需要它的组件中。

```tsx
// Bad: Header 变化导致整个 App 重渲染
function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div>
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Main /> {/* 不需要 isMenuOpen 但会重渲染 */}
      <Footer />
    </div>
  )
}

// Good: 状态封装在 Header 内部
function App() {
  return (
    <div>
      <Header />
      <Main />
      <Footer />
    </div>
  )
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  return <header>{/* ... */}</header>
}
```

### 5. 内容提升

将不变的 JSX 提升为 props。

```tsx
// Bad: ExpensiveComponent 跟随 count 变化重渲染
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveComponent />
    </div>
  )
}

// Good: 通过 children 传递，ExpensiveComponent 不会重渲染
function Parent({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      {children}
    </div>
  )
}

// 使用
<Parent>
  <ExpensiveComponent />
</Parent>
```

## 状态管理优化

### Context 拆分

避免单一大 Context 导致的全局重渲染。

```tsx
// Bad: 任何状态变化都导致所有消费者重渲染
const AppContext = createContext({ user: null, theme: 'light', locale: 'zh' })

// Good: 按功能拆分 Context
const UserContext = createContext<User | null>(null)
const ThemeContext = createContext<'light' | 'dark'>('light')
const LocaleContext = createContext<string>('zh')

// 消费者只订阅需要的 Context
function Avatar() {
  const user = useContext(UserContext) // 只在 user 变化时重渲染
  return <img src={user?.avatar} />
}
```

### 选择性订阅

使用 `useSyncExternalStore` 或状态管理库实现细粒度订阅。

```tsx
import { create } from 'zustand'

interface Store {
  user: User | null
  posts: Post[]
  setUser: (user: User) => void
  addPost: (post: Post) => void
}

const useStore = create<Store>((set) => ({
  user: null,
  posts: [],
  setUser: (user) => set({ user }),
  addPost: (post) => set((state) => ({ posts: [...state.posts, post] }))
}))

// 组件只订阅需要的状态片段
function UserProfile() {
  const user = useStore((state) => state.user) // 只在 user 变化时重渲染
  return <div>{user?.name}</div>
}

function PostList() {
  const posts = useStore((state) => state.posts) // 只在 posts 变化时重渲染
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

## 列表优化

### 虚拟滚动

对于长列表，只渲染可视区域内的元素。

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // 预估每项高度
  })

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          >
            {items[virtualItem.index].content}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 列表项优化

```tsx
// 确保列表项是稳定的记忆化组件
const ListItem = React.memo(function ListItem({
  item,
  onSelect
}: {
  item: Item
  onSelect: (id: string) => void
}) {
  const handleClick = useCallback(() => {
    onSelect(item.id)
  }, [item.id, onSelect])

  return <div onClick={handleClick}>{item.name}</div>
})

function List({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 保持回调稳定
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  return (
    <ul>
      {items.map(item => (
        <ListItem key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </ul>
  )
}
```

## 性能分析工具

### React DevTools Profiler

1. 打开 React DevTools 的 Profiler 面板
2. 点击录制按钮
3. 执行要分析的操作
4. 查看火焰图，找出耗时较长的组件

### 自定义性能追踪

```tsx
function useRenderCount(componentName: string) {
  const renderCount = useRef(0)
  renderCount.current++

  useEffect(() => {
    console.log(`${componentName} rendered ${renderCount.current} times`)
  })
}

function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>({})

  useEffect(() => {
    if (previousProps.current) {
      const changedProps = Object.entries(props).filter(
        ([key, value]) => previousProps.current[key] !== value
      )

      if (changedProps.length > 0) {
        console.log(`[${name}] Changed props:`, Object.fromEntries(changedProps))
      }
    }
    previousProps.current = props
  })
}
```

## 总结

React 性能优化的核心思路：

1. **减少渲染次数** - 使用 memo、状态下沉、内容提升
2. **减少渲染开销** - 使用 useMemo、虚拟滚动
3. **细粒度订阅** - 拆分 Context、使用状态管理库
4. **持续监控** - 使用 Profiler 定位问题

优化应该是有针对性的，在动手之前先用工具定位瓶颈，避免过早优化带来的代码复杂度增加。

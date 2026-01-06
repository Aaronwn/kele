---
title: Vue 3 vs React：设计理念与实现原理对比
description: 深入对比 Vue 3 和 React 的核心语法、设计哲学与底层实现机制
date: 2024-11-28T10:00:00.000+00:00
lang: zh
duration: 22min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

作为前端开发者，Vue 和 React 是我们最常接触的两个框架。它们虽然都用于构建用户界面，但在设计理念和实现方式上却有着本质的不同。

本文将从**语法对比**和**实现原理**两个维度，系统性地分析两个框架的异同。既帮助你快速掌握语法差异，又能理解这些差异背后的设计思想，从而在技术选型和日常开发中做出更明智的决策。

## 心智模型差异

### 响应式 vs 不可变

Vue 采用响应式数据，直接修改触发更新：

```vue
<script setup>
const user = reactive({
  name: 'John',
  age: 25
})

function birthday() {
  user.age++ // 直接修改,自动触发更新
}
</script>
```

React 采用不可变数据，需要创建新引用：

```tsx
function UserProfile() {
  const [user, setUser] = useState({ name: 'John', age: 25 })

  function birthday() {
    // 必须创建新对象
    setUser(prev => ({ ...prev, age: prev.age + 1 }))
  }
}
```

**底层原理差异**：

Vue 3 使用 **Proxy** 劫持对象，在属性访问和修改时自动完成依赖收集和派发更新：

```javascript
// Vue 3 响应式简化原理
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key) // 收集依赖
      return target[key]
    },
    set(target, key, value) {
      target[key] = value
      trigger(target, key) // 触发更新
      return true
    }
  })
}
```

React 则基于 **不可变数据** + **引用比较** 来检测变化。只有当状态的引用发生变化时才会触发重新渲染：

```javascript
// React 检测更新的简化逻辑
function checkIfShouldUpdate(prevState, nextState) {
  // 浅比较引用
  return prevState !== nextState
}
```

这种设计差异直接影响了开发体验：
- Vue：写法更接近原生 JavaScript，但需要理解响应式边界（如数组方法、解构赋值）
- React：强制不可变更新，更易追踪数据流，但需要频繁使用展开运算符

### 模板 vs JSX

Vue 的模板语法更接近 HTML：

```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id" :class="{ active: item.active }">
      <span v-if="item.visible">{{ item.name }}</span>
      <span v-else>Hidden</span>
    </li>
  </ul>
</template>
```

React 的 JSX 是 JavaScript 的扩展：

```tsx
function ItemList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} className={item.active ? 'active' : ''}>
          {item.visible ? <span>{item.name}</span> : <span>Hidden</span>}
        </li>
      ))}
    </ul>
  )
}
```

**编译原理差异**：

Vue 的模板会在**编译时**进行大量优化，生成高效的渲染函数：

```javascript
// Vue 模板编译后的简化输出
function render() {
  return createVNode('ul', null, [
    (openBlock(), createBlock(Fragment, null,
      items.map(item => {
        return createVNode('li', {
          key: item.id,
          class: { active: item.active }
        }, [
          item.visible
            ? createVNode('span', null, item.name, PatchFlags.TEXT) // 标记为纯文本更新
            : createVNode('span', null, 'Hidden')
        ])
      })
    ))
  ])
}

// 编译器会分析出：
// 1. 静态节点可以提升
// 2. 动态绑定可以打上 PatchFlag 标记
// 3. 事件处理器可以缓存
```

React 的 JSX 在**运行时**转换为 `createElement` 调用，更加灵活但缺少编译时优化：

```javascript
// JSX 编译后的输出（简化）
function ItemList({ items }) {
  return React.createElement('ul', null,
    items.map(item =>
      React.createElement('li', {
        key: item.id,
        className: item.active ? 'active' : ''
      },
        item.visible
          ? React.createElement('span', null, item.name)
          : React.createElement('span', null, 'Hidden')
      )
    )
  )
}
```

核心差异：
- **Vue 模板**：受限的语法换来编译时优化，运行时性能更优
- **JSX**：完全的 JavaScript 表达能力，更灵活但需要运行时做更多工作

## 概念映射

### 组件定义

| Vue 概念 | React 对应 |
|----------|------------|
| `<script setup>` | 函数组件体 |
| `defineProps` | 函数参数 + TypeScript |
| `defineEmits` | 回调函数 props |
| `ref()` | `useState()` |
| `reactive()` | `useState()` 或 `useReducer()` |
| `computed()` | `useMemo()` |
| `watch()` | `useEffect()` |

### Props 与 Events

Vue 的 props 和 emits：

```vue
<script setup>
const props = defineProps<{
  title: string
  count: number
}>()

const emit = defineEmits<{
  update: [value: number]
  close: []
}>()

function handleClick() {
  emit('update', props.count + 1)
}
</script>
```

React 使用回调函数：

```tsx
interface Props {
  title: string
  count: number
  onUpdate: (value: number) => void
  onClose: () => void
}

function MyComponent({ title, count, onUpdate, onClose }: Props) {
  function handleClick() {
    onUpdate(count + 1)
  }

  return <button onClick={handleClick}>{title}</button>
}
```

### 状态管理

Vue 的 `ref` 和 `reactive`：

```vue
<script setup>
const count = ref(0)
const user = reactive({ name: '', email: '' })

function increment() {
  count.value++
}

function updateName(name: string) {
  user.name = name
}
</script>
```

React 的 `useState`：

```tsx
function MyComponent() {
  const [count, setCount] = useState(0)
  const [user, setUser] = useState({ name: '', email: '' })

  function increment() {
    setCount(c => c + 1)
  }

  function updateName(name: string) {
    setUser(prev => ({ ...prev, name }))
  }
}
```

### 计算属性

Vue 的 `computed`：

```vue
<script setup>
const items = ref([1, 2, 3, 4, 5])
const filter = ref('')

// 自动依赖收集：computed 会追踪内部访问的响应式数据
const filteredItems = computed(() =>
  items.value.filter(item => item.toString().includes(filter.value))
)

// Vue 会自动知道 filteredItems 依赖 items 和 filter
// 只有当依赖变化时才重新计算，否则返回缓存值
</script>
```

React 的 `useMemo`：

```tsx
function ItemList() {
  const [items] = useState([1, 2, 3, 4, 5])
  const [filter, setFilter] = useState('')

  // 显式声明依赖：必须手动列出 items 和 filter
  const filteredItems = useMemo(
    () => items.filter(item => item.toString().includes(filter)),
    [items, filter] // 依赖数组：遗漏会导致 bug，冗余会影响性能
  )
}
```

**依赖收集机制差异**：

```javascript
// Vue：运行时自动追踪
// 当执行 computed 函数时，访问响应式属性会被自动记录
function computed(getter) {
  const effect = new ReactiveEffect(getter)
  effect.run() // 执行时自动收集依赖
  return effect.value
}

// React：编译时静态分析 + 开发者手动声明
// ESLint 规则会检查依赖数组是否完整
// 但最终依赖是否正确由开发者保证
```

使用建议：
- **Vue**：适合复杂的依赖关系，无需担心遗漏依赖
- **React**：适合明确的依赖关系，需要团队严格遵守 hooks 规则

### 侦听器

Vue 的 `watch`：

```vue
<script setup>
const searchQuery = ref('')
const results = ref([])

// watch 会自动清理上一次的副作用
watch(searchQuery, async (newQuery, oldQuery) => {
  if (newQuery) {
    results.value = await search(newQuery)
  }
}, {
  immediate: true, // 立即执行一次
  deep: true       // 深度监听对象内部变化
})

// 返回清理函数，组件卸载时自动调用
const stop = watch(searchQuery, (newQuery) => {
  const controller = new AbortController()

  fetch(`/api/search?q=${newQuery}`, {
    signal: controller.signal
  })

  // 清理函数：下次执行或组件卸载时调用
  return () => controller.abort()
})
</script>
```

React 的 `useEffect`：

```tsx
function SearchComponent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (searchQuery) {
      const controller = new AbortController()

      fetch(`/api/search?q=${searchQuery}`, {
        signal: controller.signal
      }).then(data => setResults(data))

      // 必须显式返回清理函数
      return () => controller.abort()
    }
  }, [searchQuery]) // 必须手动声明依赖

  // 模拟 immediate: true 需要单独处理
  useEffect(() => {
    // 初始化逻辑
  }, [])
}
```

**依赖追踪与清理机制差异**：

- **Vue watch**：
  - 自动追踪依赖，无需手动声明
  - 支持 `immediate` 和 `deep` 选项
  - 清理函数由 watch 回调返回，更直观

- **React useEffect**：
  - 必须手动声明依赖数组
  - 需要额外的 effect 来实现 immediate 行为
  - 清理函数通过 return 返回，每次 effect 重新执行前都会调用

常见场景对比：

```typescript
// Vue：监听多个值
watch([count, name], ([newCount, newName]) => {
  console.log(`Count: ${newCount}, Name: ${newName}`)
})

// React：需要将多个值都放入依赖数组
useEffect(() => {
  console.log(`Count: ${count}, Name: ${name}`)
}, [count, name])
```

## 常见模式转换

### 双向绑定

Vue 的 `v-model`：

```vue
<template>
  <input v-model="text" />
  <MyInput v-model="value" />
</template>
```

React 需要手动绑定：

```tsx
function Form() {
  const [text, setText] = useState('')
  const [value, setValue] = useState('')

  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <MyInput value={value} onChange={setValue} />
    </>
  )
}
```

### 插槽 vs Children

Vue 的具名插槽：

```vue
<!-- ParentComponent.vue -->
<template>
  <Card>
    <template #header>
      <h1>Title</h1>
    </template>
    <template #default>
      <p>Content</p>
    </template>
    <template #footer>
      <button>Submit</button>
    </template>
  </Card>
</template>
```

React 使用 props：

```tsx
function App() {
  return (
    <Card
      header={<h1>Title</h1>}
      footer={<button>Submit</button>}
    >
      <p>Content</p>
    </Card>
  )
}

function Card({
  header,
  children,
  footer
}: {
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="card">
      {header && <div className="header">{header}</div>}
      <div className="body">{children}</div>
      {footer && <div className="footer">{footer}</div>}
    </div>
  )
}
```

### 依赖注入 vs Context

Vue 的 provide/inject：

```vue
<!-- 祖先组件 -->
<script setup>
import { provide } from 'vue'
provide('theme', ref('dark'))
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from 'vue'
const theme = inject('theme')
</script>
```

React 的 Context：

```tsx
// 创建 Context
const ThemeContext = createContext<'light' | 'dark'>('light')

// 提供者
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  return (
    <ThemeContext.Provider value={theme}>
      <MainContent />
    </ThemeContext.Provider>
  )
}

// 消费者
function ThemedButton() {
  const theme = useContext(ThemeContext)
  return <button className={theme}>Click me</button>
}
```

## 实现原理深度对比

理解框架的底层实现原理，可以帮助我们更好地理解为什么会有这些语法差异，以及在性能优化时应该关注什么。

### 响应式系统原理

#### Vue 3 的响应式系统

Vue 3 使用 Proxy 实现响应式系统，核心是**依赖收集**和**派发更新**：

```javascript
// 简化的响应式实现
let activeEffect = null

class ReactiveEffect {
  constructor(fn) {
    this.fn = fn
    this.deps = [] // 存储依赖的响应式对象
  }

  run() {
    activeEffect = this // 设置当前激活的 effect
    this.fn()            // 执行函数，触发依赖收集
    activeEffect = null
  }
}

const targetMap = new WeakMap() // 存储依赖关系

function track(target, key) {
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  dep.add(activeEffect) // 收集依赖
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const effects = depsMap.get(key)
  if (effects) {
    effects.forEach(effect => effect.run()) // 触发更新
  }
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key) // 访问时收集依赖
      return target[key]
    },
    set(target, key, value) {
      target[key] = value
      trigger(target, key) // 修改时触发更新
      return true
    }
  })
}
```

**关键特性**：
- 运行时自动追踪依赖，无需手动声明
- 细粒度的更新：只有使用了该属性的组件才会更新
- 支持嵌套对象的深度响应式

#### React 的状态更新机制

React 基于**不可变数据** + **Fiber 架构**实现状态管理：

```javascript
// 简化的 setState 实现
function useState(initialValue) {
  const hook = getCurrentHook()

  if (hook.state === undefined) {
    hook.state = initialValue
  }

  const setState = (newValue) => {
    // 比较引用是否变化
    if (hook.state !== newValue) {
      hook.state = newValue
      // 调度更新
      scheduleUpdate(currentFiber)
    }
  }

  return [hook.state, setState]
}

function scheduleUpdate(fiber) {
  // 标记需要更新的 fiber
  fiber.flags |= Update

  // 根据优先级调度更新
  if (isHighPriority) {
    performSyncWorkOnRoot(fiber)
  } else {
    scheduleCallback(performConcurrentWorkOnRoot, fiber)
  }
}
```

**Fiber 架构核心**：

```javascript
// Fiber 节点结构
const fiber = {
  type: Component,           // 组件类型
  props: {},                // 属性
  stateNode: instance,      // 组件实例
  alternate: oldFiber,      // 上一次渲染的 fiber（双缓存）
  child: childFiber,        // 第一个子节点
  sibling: siblingFiber,    // 下一个兄弟节点
  return: parentFiber,      // 父节点
  flags: Update,            // 副作用标记
}

// 可中断的渲染
function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 0) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }

  if (nextUnitOfWork) {
    // 时间片用完，让出主线程
    requestIdleCallback(workLoop)
  } else {
    // 完成渲染，提交更新
    commitRoot()
  }
}
```

**关键特性**：
- 批量更新：多次 setState 会被合并
- 优先级调度：高优先级更新可以打断低优先级更新
- 时间切片：长时间渲染可以被拆分，不阻塞用户交互

**对比总结**：
- **Vue**：精确追踪依赖，更新粒度更细，但运行时有追踪开销
- **React**：自顶向下更新，需要手动优化（memo/useMemo），但有更灵活的调度能力

### 虚拟 DOM 与 Diff 算法

#### Vue 的编译时优化

Vue 通过模板编译，在**编译时**就能分析出静态内容和动态内容，生成优化的渲染代码：

```vue
<template>
  <div class="container">
    <h1>Static Title</h1>
    <p>{{ dynamicText }}</p>
    <button @click="handleClick">{{ buttonText }}</button>
  </div>
</template>
```

编译后生成带有优化提示的代码：

```javascript
import { createVNode as _createVNode, toDisplayString as _toDisplayString } from 'vue'

// 静态节点提升到渲染函数外部
const _hoisted_1 = { class: "container" }
const _hoisted_2 = /*#__PURE__*/ _createVNode("h1", null, "Static Title", -1 /* HOISTED */)

export function render() {
  return _createVNode("div", _hoisted_1, [
    _hoisted_2, // 静态节点，永远不会变化
    _createVNode("p", null, _toDisplayString(dynamicText), 1 /* TEXT */), // PatchFlag: 仅文本会变
    _createVNode("button", { onClick: handleClick }, _toDisplayString(buttonText), 9 /* TEXT, PROPS */)
  ])
}
```

**PatchFlag 优化机制**：

```javascript
// PatchFlag 标记类型
const enum PatchFlags {
  TEXT = 1,              // 动态文本
  CLASS = 2,             // 动态 class
  STYLE = 4,             // 动态 style
  PROPS = 8,             // 动态属性（除 class/style）
  FULL_PROPS = 16,       // 有动态 key 的属性
  HYDRATE_EVENTS = 32,   // 事件监听器
  STABLE_FRAGMENT = 64,  // 稳定的 children 顺序
  KEYED_FRAGMENT = 128,  // 带 key 的 children
  UNKEYED_FRAGMENT = 256,// 不带 key 的 children
  NEED_PATCH = 512,      // 需要 patch
  DYNAMIC_SLOTS = 1024,  // 动态插槽
  HOISTED = -1,          // 静态节点，已提升
  BAIL = -2              // Diff 算法应该退出优化模式
}

// Diff 时可以跳过静态节点，只对比有 PatchFlag 的节点
function patchElement(oldVNode, newVNode) {
  const patchFlag = newVNode.patchFlag

  if (patchFlag & PatchFlags.TEXT) {
    // 只更新文本
    patchText(oldVNode, newVNode)
  }

  if (patchFlag & PatchFlags.CLASS) {
    // 只更新 class
    patchClass(oldVNode, newVNode)
  }

  // 其他 PatchFlag 处理...
}
```

#### React 的运行时 Diff

React 使用**双缓存 Fiber 树**进行 Diff，在运行时递归对比：

```javascript
// React Fiber Diff 简化流程
function reconcileChildren(currentFiber, newChildren) {
  let oldFiber = currentFiber.child
  let prevSibling = null

  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i]

    // 判断是否可以复用
    const isSameType = oldFiber && oldFiber.type === newChild.type

    let newFiber

    if (isSameType) {
      // 复用节点，仅更新 props
      newFiber = {
        type: oldFiber.type,
        props: newChild.props,
        stateNode: oldFiber.stateNode, // 复用 DOM 节点
        alternate: oldFiber,
        flags: Update
      }
    } else {
      // 创建新节点
      newFiber = {
        type: newChild.type,
        props: newChild.props,
        stateNode: null,
        alternate: null,
        flags: Placement
      }

      // 删除旧节点
      if (oldFiber) {
        oldFiber.flags = Deletion
      }
    }

    // 构建 Fiber 树
    if (i === 0) {
      currentFiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    oldFiber = oldFiber?.sibling
  }
}
```

**Key 的作用**：

```jsx
// 没有 key：按索引对比，可能导致错误的复用
<ul>
  {items.map(item => <li>{item.text}</li>)}
</ul>

// 有 key：按 key 对比，正确识别节点
<ul>
  {items.map(item => <li key={item.id}>{item.text}</li>)}
</ul>
```

**性能对比**：
- **Vue**：编译时优化 + 靶向更新，跳过静态内容，更新效率高
- **React**：运行时 Diff，灵活性强，但需要遍历整个树（可通过 memo 优化）

### 组件更新策略

#### Vue 的精确更新

Vue 组件通过**响应式依赖追踪**，实现精确更新：

```vue
<script setup>
// 父组件
const count = ref(0)
const name = ref('Vue')

function increment() {
  count.value++
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <!-- Child 组件没有使用 count，所以 count 变化时 Child 不会重新渲染 -->
    <Child :name="name" />
  </div>
</template>
```

**原理**：每个组件都有自己的渲染 effect，只追踪模板中实际使用的响应式数据。

#### React 的自顶向下更新

React 默认采用**自顶向下**的更新策略：

```tsx
// 父组件
function Parent() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('React')

  return (
    <div>
      <p>Count: {count}</p>
      {/* count 变化时，Child 也会重新渲染（即使它不使用 count） */}
      <Child name={name} />
    </div>
  )
}

// 需要 memo 优化
const Child = memo(function Child({ name }) {
  console.log('Child render')
  return <div>{name}</div>
})
```

**为什么需要显式优化**：

```tsx
// 问题1：每次渲染都创建新的对象/函数
function Parent() {
  const [count, setCount] = useState(0)

  // 每次渲染都是新的对象引用
  const style = { color: 'red' }
  const handleClick = () => console.log('clicked')

  return <Child style={style} onClick={handleClick} />
}

// 解决方案：使用 useMemo 和 useCallback
function Parent() {
  const [count, setCount] = useState(0)

  const style = useMemo(() => ({ color: 'red' }), [])
  const handleClick = useCallback(() => console.log('clicked'), [])

  return <Child style={style} onClick={handleClick} />
}
```

**更新策略对比**：

| 方面 | Vue | React |
|------|-----|-------|
| 默认行为 | 精确更新，只更新使用了变化数据的组件 | 自顶向下，父组件更新会触发所有子组件更新 |
| 性能优化 | 自动优化，无需手动干预 | 需要使用 memo/useMemo/useCallback |
| 开发体验 | 简单直观，但响应式边界需要理解 | 需要理解引用比较，有一定学习成本 |
| 灵活性 | 受限于响应式系统 | 完全可控，可以精细调优 |

## 常见陷阱

### 1. 闭包陷阱

```tsx
// ❌ 错误：闭包捕获旧值
function Counter() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setTimeout(() => {
      setCount(count + 1) // count 是旧值
    }, 1000)
  }
}

// ✅ 正确：使用函数式更新
function Counter() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setTimeout(() => {
      setCount(c => c + 1) // 总是基于最新值
    }, 1000)
  }
}
```

### 2. useEffect 依赖

```tsx
// ❌ 错误：缺少依赖
function SearchResults({ query }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    fetchResults(query).then(setResults)
  }, []) // 缺少 query 依赖

// ✅ 正确：完整依赖
  useEffect(() => {
    fetchResults(query).then(setResults)
  }, [query])
}
```

### 3. 对象/数组引用

```tsx
// ❌ 错误：每次渲染创建新对象
function Parent() {
  return <Child style={{ color: 'red' }} /> // 每次都是新对象
}

// ✅ 正确：稳定引用
const style = { color: 'red' }
function Parent() {
  return <Child style={style} />
}

// 或使用 useMemo
function Parent() {
  const style = useMemo(() => ({ color: 'red' }), [])
  return <Child style={style} />
}
```

## 总结

通过对比 Vue 3 和 React 的语法与实现原理，我们可以看到两个框架在设计哲学上的本质差异：

### 1. 响应式 vs 显式声明

**Vue**：采用自动依赖追踪的响应式系统
- Proxy 劫持数据访问，运行时自动收集依赖
- 开发者无需关心依赖管理，写法更接近原生 JavaScript
- 更新粒度细，默认性能就很好

**React**：采用显式声明的状态管理方式
- 不可变数据 + 引用比较检测变化
- 开发者需要显式声明依赖（useEffect/useMemo 的依赖数组）
- 需要手动优化性能，但更易理解数据流

### 2. 编译时优化 vs 运行时灵活性

**Vue**：编译时优化，运行时高效
- 模板编译器分析静态/动态内容，生成优化的渲染代码
- PatchFlag 标记、静态提升、事件缓存等优化手段
- 性能优秀，但模板语法受限

**React**：运行时灵活，编译时简单
- JSX 本质上就是 JavaScript，完全的表达能力
- 运行时进行 Diff，依赖开发者优化
- 灵活性强，适合复杂的动态场景

### 3. 自动化 vs 可控性

**Vue**：自动化程度高，开箱即用
- 响应式自动追踪，无需 memo/useCallback
- 组件默认阻止不必要的更新
- 适合快速开发，降低心智负担

**React**：可控性强，需要显式优化
- 自顶向下更新，需要 memo/useMemo/useCallback 优化
- 引用比较机制清晰，容易排查性能问题
- 适合大型应用的精细化性能调优

### 4. 心智模型差异

**Vue**：渐进式，更接近传统 Web 开发
- 模板语法像 HTML，指令像原生属性
- 响应式数据像普通 JavaScript 对象
- 学习曲线平缓，容易上手

**React**：函数式，更接近 JavaScript 编程
- JSX 就是 JavaScript 表达式
- 一切皆函数，纯粹的组件组合
- 需要理解闭包、引用等概念，但一致性强

### 选择建议

- **选择 Vue**：快速开发、团队经验有限、重视开箱即用的性能
- **选择 React**：大型应用、需要精细控制、团队有较强的 JavaScript 功底

两个框架没有绝对的优劣，**理解其设计哲学和实现原理，比死记语法差异更重要**。只有深入理解原理，才能在实际开发中做出最佳的技术决策。

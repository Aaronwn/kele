---
title: 从需求到上线：AI 如何改变我的前端研发流程
description: 分享 AI 工具如何融入前端研发的每个阶段，以及带来的效率变革
date: 2025-04-07
lang: zh
duration: 18min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

传统的前端研发流程大家都很熟悉：需求评审 → 技术方案 → 编码 → 自测 → Code Review → 测试 → 上线。每个环节都有它的痛点：

- **需求理解**：PRD 又长又杂，理解成本高，容易遗漏细节
- **技术方案**：从零开始写方案，反复推敲架构设计
- **编码阶段**：重复代码多，模板代码多，查文档时间长
- **调试排错**：控制台一堆报错，Stack Overflow 搜半天
- **Code Review**：Review 别人代码时走马观花，自己代码被 Review 时紧张兮兮
- **测试用例**：写单测枯燥乏味，覆盖率总是上不去

现在，这些痛点都有了不同程度的解决方案。本文将分享 AI 如何融入我研发流程的每个阶段。

## 需求分析阶段：让 AI 帮你理解 PRD

### PRD 解读

拿到一份 PRD，我的第一步不再是埋头苦读，而是让 Claude 帮我做结构化梳理：

```text
我是前端工程师，请帮我分析这份 PRD：

1. 用一句话总结这个需求的核心目标
2. 列出所有前端需要实现的功能点
3. 标注可能的技术难点
4. 指出 PRD 中描述不清晰、需要和产品确认的地方
5. 预估工作量（简单/中等/复杂）

PRD 内容如下：
[粘贴 PRD]
```

这个 Prompt 能帮我在 5 分钟内对需求有一个全局认知。更重要的是，AI 往往能发现我遗漏的细节和产品没说清楚的地方——这些在需求评审时提出来，比开发到一半再去确认强太多了。

### 技术方案设计

确认需求后，我会让 Claude 帮我生成技术方案的初稿：

```text
基于上述需求，我需要设计前端技术方案，项目技术栈是 Vue 3 + TypeScript + Pinia。

请帮我设计：
1. 组件拆分方案（列出主要组件及职责）
2. 状态管理方案（哪些状态需要全局管理）
3. API 接口设计建议
4. 需要考虑的边界情况
```

AI 生成的方案不一定完美，但它提供了一个很好的起点。我在这个基础上进行调整和补充，比从零开始写方案效率高很多。

## 编码阶段：Cursor 与 Claude Code 的配合

这是 AI 发挥最大价值的阶段。我日常主要使用两个工具：

- **Cursor**：IDE 级别的 AI 编程助手，适合在编辑器内完成大部分编码工作
- **Claude Code**：命令行工具，适合跨文件操作、批量修改、项目级别的任务

### Cursor：日常编码主力

Cursor 的 Tab 补全已经成为我的肌肉记忆。它最强大的地方在于理解上下文：

```typescript
// 我只需要写一行注释，Cursor 就能补全整个函数
// 根据用户ID获取用户信息，包含错误处理和loading状态
```

Tab 一下，Cursor 会生成类似这样的代码：

```typescript
async function fetchUserById(userId: string) {
  const loading = ref(true)
  const error = ref<Error | null>(null)
  const user = ref<User | null>(null)

  try {
    const response = await api.get<User>(`/users/${userId}`)
    user.value = response.data
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Unknown error')
  } finally {
    loading.value = false
  }

  return { user, loading, error }
}
```

当然，生成的代码需要 Review。但这比我从零开始写快了至少 3 倍。

对于复杂一点的需求，我会使用 Cursor 的 Chat 功能（Cmd+L），直接描述我想要的功能：

```text
帮我实现一个虚拟列表组件，要求：
1. 支持固定高度和动态高度两种模式
2. 支持滚动到指定索引
3. 暴露 scrollTo 方法
4. 使用 Vue 3 Composition API
```

### Claude Code：项目级别的助手

Claude Code 是我最近重度使用的工具。它和 Cursor 最大的区别是：**Claude Code 能理解整个项目的上下文**。

比如我想重构某个模块：

```bash
claude "把 src/utils/request.ts 从 axios 迁移到 ofetch，保持 API 不变"
```

Claude Code 会：
1. 读取现有的 request.ts 文件
2. 分析所有使用这个模块的地方
3. 生成迁移后的代码
4. 甚至会更新相关的类型定义

再比如批量添加类型：

```bash
claude "给 src/api 目录下所有接口函数添加完整的 TypeScript 类型"
```

这种跨多个文件的批量操作，是 Cursor 不太擅长的场景。

### 实际开发中的配合

我的典型工作流是这样的：

1. **新功能开发**：在 Cursor 中用 Chat 讨论实现方案，然后边写边用 Tab 补全
2. **重构/迁移**：用 Claude Code，因为它能理解整个项目上下文
3. **修复 Bug**：先在 Cursor 中定位问题，如果涉及多文件就切到 Claude Code
4. **写工具函数**：Cursor 的 Tab 补全足够了

## 调试阶段：AI 是最好的 Debug 伙伴

以前遇到报错，我的流程是：

1. 复制错误信息
2. 打开 Google/Stack Overflow
3. 翻好几个回答
4. 尝试各种方案
5. 可能还是没解决

现在我的流程是：

```text
报错信息：
[粘贴完整的报错堆栈]

相关代码：
[粘贴可能有问题的代码]

请分析错误原因并给出解决方案。
```

AI 的优势在于：
- **理解上下文**：它能结合我的代码分析，而不是给通用答案
- **直接给方案**：不用我在多个回答中筛选
- **能追问**：第一次没解决可以继续追问，它记得之前的对话

最近 Cursor 支持了报错快速修复功能，控制台的错误可以一键发送给 AI 分析，体验更流畅了。

### 排查疑难杂症

有些问题不是明确的报错，而是"行为不符合预期"。这时候我会让 AI 帮我梳理排查思路：

```text
问题现象：列表数据请求成功，但页面不更新

已排查：
- Network 显示接口返回正常
- console.log 显示数据已赋值给响应式变量

相关代码：
[粘贴代码]

请帮我分析可能的原因和排查方向。
```

AI 会列出几个可能的原因，比如：
- 响应式丢失（直接替换了整个对象）
- v-if/v-show 条件没满足
- key 没变导致组件没重新渲染
- ……

这比我自己一个个猜效率高多了。

## Code Review：AI 作为第一道防线

### Review 自己的代码

提测前，我会让 AI 先 Review 一遍：

```bash
claude "Review 我刚才的修改，检查是否有：
1. 潜在的 Bug 或边界情况未处理
2. 性能问题
3. 安全问题（XSS、注入等）
4. 不符合项目规范的地方"
```

Claude Code 能看到 git diff，所以它能精准地 Review 变更的部分。

这样做有几个好处：
- **提前发现问题**：不用等同事 Review 时指出
- **节省他人时间**：低级错误自己先改掉
- **学习提升**：AI 指出的问题往往是我的知识盲区

### Review 他人的代码

当我需要 Review 同事的 PR 时，AI 也能帮忙：

```text
请帮我 Review 这段代码变更，重点关注：
1. 逻辑是否正确
2. 是否有更好的实现方式
3. 是否符合 TypeScript 最佳实践

[粘贴 diff]
```

AI 不是替代我 Review，而是帮我发现我可能忽略的问题。最终的判断和建议还是我来给。

## 测试阶段：让 AI 写单测

写单测是很多前端开发者的痛点。不是不会写，是太枯燥了。

现在我的做法：

```bash
claude "给 src/utils/format.ts 中的所有函数写单元测试，使用 Vitest"
```

AI 会生成类似这样的测试用例：

```typescript
import { describe, it, expect } from 'vitest'
import { formatDate, formatMoney, formatPhone } from './format'

describe('formatDate', () => {
  it('should format date with default pattern', () => {
    const date = new Date('2025-04-07')
    expect(formatDate(date)).toBe('2025-04-07')
  })

  it('should format date with custom pattern', () => {
    const date = new Date('2025-04-07')
    expect(formatDate(date, 'YYYY/MM/DD')).toBe('2025/01/06')
  })

  it('should return empty string for invalid date', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('should handle timestamp input', () => {
    const timestamp = 1704499200000
    expect(formatDate(timestamp)).toBe('2024-01-06')
  })
})

describe('formatMoney', () => {
  it('should format with thousand separators', () => {
    expect(formatMoney(1234567.89)).toBe('1,234,567.89')
  })

  it('should handle zero', () => {
    expect(formatMoney(0)).toBe('0.00')
  })

  it('should handle negative numbers', () => {
    expect(formatMoney(-1234.5)).toBe('-1,234.50')
  })
})
```

AI 生成的测试用例覆盖了正常情况、边界情况、异常情况。我在这个基础上稍作调整，比自己从零写快太多了。

### 提升测试覆盖率

当项目测试覆盖率不达标时，我会这样用：

```bash
claude "分析 src/components/UserCard.vue 的代码，生成测试用例以提高测试覆盖率。当前覆盖率报告显示缺少以下分支的测试：[粘贴覆盖率报告]"
```

AI 能针对性地补充缺失的测试分支。

## 部署与文档：自动化收尾

### 生成 Changelog

发版前需要整理 Changelog，以前是手动去翻 Git 提交记录。现在：

```bash
claude "根据最近一周的 git commit 记录，生成本次版本的 Changelog，按 feat/fix/refactor 分类"
```

### 补充代码注释

有时候写完代码才发现注释不够，特别是公共函数：

```bash
claude "给 src/utils 目录下的所有导出函数添加 JSDoc 注释，包括参数说明、返回值说明、使用示例"
```

### 更新 README

```bash
claude "根据项目当前状态更新 README.md，包括安装步骤、开发命令、项目结构说明"
```


## 需要注意的问题

AI 不是万能的，使用过程中我也踩了一些坑：

### 1. 不能盲目信任

AI 生成的代码必须 Review。我遇到过几次 AI 生成的代码有隐藏 Bug，比如：
- 边界条件没处理
- 异步逻辑有问题
- 使用了已废弃的 API

**原则：AI 写代码，人做 Review**。

### 2. 上下文很重要

AI 的输出质量取决于你给的上下文。Prompt 写得越清晰、背景信息给得越充分，结果越好。

### 3. 不适合的场景

- **强业务逻辑**：涉及复杂业务规则的代码，AI 不了解你的业务上下文
- **性能关键路径**：需要极致优化的代码，AI 给的往往是通用方案
- **安全敏感代码**：认证、加密相关的代码要特别谨慎

### 4. 避免过度依赖

AI 是工具，不是拐杖。基础能力还是要有，不然连 AI 的输出对不对都判断不了。

## 总结

AI 改变前端研发流程不是一个选择题，而是正在发生的事实。

从我的实践来看，AI 最大的价值不是"替代"，而是"增强"：
- 它帮我处理重复劳动，让我专注于真正需要思考的部分
- 它帮我快速入门不熟悉的领域，降低学习成本
- 它作为一个随时在线的助手，提升了整体研发效率

工具在不断进化，今天的 Cursor 和 Claude Code 只是开始。作为前端工程师，拥抱 AI、学会与 AI 协作，是这个时代的必修课。

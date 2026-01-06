---
title: 前端工程师的 AI 工具链：2025 年我的效率提升方案
description: 分享我日常使用的 AI 工具、配置方案和最佳实践
date: 2025-07-03
lang: zh
duration: 20min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

最近2 年 AI 编程工具爆发。GitHub Copilot 持续进化、Cursor 异军突起、Claude 推出了 Claude Code CLI……作为重度使用者，我花了大量时间探索这些工具的最佳使用方式。

本文将分享我当前的 AI 工具链配置，以及在实际工作中如何高效使用这些工具。

## 我的 AI 工具栈

### 核心工具

| 工具 | 定位 | 使用场景 |
|------|------|---------|
| Cursor | 主力 IDE | 日常编码、小范围修改 |
| Claude Code | CLI 工具 | 项目级操作、批量修改、复杂任务 |
| Claude | 对话 AI | 技术方案讨论、学习新概念 |

### 为什么是这套组合？

- **Cursor**：编辑器内的 AI 体验是最流畅的，Tab 补全、Chat、内联编辑一气呵成
- **Claude Code**：能理解整个项目上下文，适合跨文件操作，而且在终端里用起来很 Geek
- **Claude**：当我需要深度讨论某个技术问题时，网页版的对话体验更好

三者配合覆盖了我 99% 的 AI 辅助开发需求。

## Cursor 配置与使用

### Rules 配置

Cursor 支持项目级的 Rules 配置，这是提升 AI 输出质量的关键。我在项目根目录创建 `.cursor/rules` 文件：

```markdown
# Project Context

这是一个 Vue 3 + TypeScript + Vite 项目。

## 技术栈
- Vue 3.4+ with Composition API (script setup)
- TypeScript 5.x strict mode
- Pinia for state management
- UnoCSS for styling
- Vitest for unit testing

## 代码规范
- 使用 Composition API，不使用 Options API
- 组件使用 `<script setup lang="ts">` 语法
- 响应式变量使用 ref/reactive，优先使用 ref
- 类型定义放在 `src/types` 目录
- API 请求放在 `src/api` 目录，每个模块一个文件
- 公共组件放在 `src/components` 目录
- 使用 ofetch 发送请求，不使用 axios

## 命名规范
- 组件文件名：PascalCase，如 UserCard.vue
- 组合式函数：以 use 开头，如 useUserList.ts
- 类型/接口：以 I 或 T 开头，如 IUser, TUserList
- 常量：UPPER_SNAKE_CASE
- CSS 类名：kebab-case

## 偏好
- 优先使用 ES6+ 语法
- 使用 async/await 而非 .then()
- 错误处理使用 try/catch
- 优先使用函数式编程方法（map, filter, reduce）
```

有了这份配置，Cursor 生成的代码会自动遵循项目规范，省去了大量手动调整的时间。

### 常用快捷键

```text
Cmd + K       内联编辑（选中代码后修改）
Cmd + L       打开 Chat 面板
Cmd + I       打开 Composer（多文件编辑）
Tab           接受 AI 补全
Esc           拒绝 AI 补全
Cmd + →       部分接受（逐词接受）
```

### Tab 补全技巧

Cursor 的 Tab 补全是最常用的功能，几个技巧可以让它更准确：

**1. 写好注释再按 Tab**

```typescript
// 防抖函数，支持立即执行模式
// debounce function with immediate execution support
```

注释写得越清楚，生成的代码越准确。中英文注释都写效果更好。

**2. 先写函数签名**

```typescript
function formatPrice(price: number, currency: 'CNY' | 'USD' = 'CNY'): string {
  // Tab 补全函数体
}
```

让 AI 知道输入输出类型，生成的逻辑更准确。

**3. 提供示例**

```typescript
// 将对象数组按指定字段分组
// groupBy([{type: 'a', v: 1}, {type: 'b', v: 2}, {type: 'a', v: 3}], 'type')
// => { a: [{type: 'a', v: 1}, {type: 'a', v: 3}], b: [{type: 'b', v: 2}] }
function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
```

示例是最好的文档，AI 也是这么认为的。

### Agent 模式：自主完成复杂任务

Cursor 的 Agent 模式是处理复杂任务的大杀器。在 Chat 面板中开启 Agent 模式后，AI 可以：

- 自动读取和搜索代码文件
- 执行终端命令（安装依赖、运行测试等）
- 跨多个文件进行修改
- 自主决定下一步操作

```text
我需要添加一个用户管理模块，包括：
1. 用户相关 API（获取列表、详情、创建、更新、删除）
2. TypeScript 类型定义
3. Pinia 状态管理
4. 用户列表页面

请帮我实现完整功能。
```

Agent 会自动分析项目结构，创建所需文件，并确保它们之间的引用关系正确。整个过程你可以看到 AI 的"思考过程"和每一步操作。

### Plan 模式：先规划再执行

对于更复杂的任务，可以让 Agent 先生成计划：

```text
/plan 重构项目的状态管理，从 Vuex 迁移到 Pinia
```

Agent 会先分析代码，生成详细的迁移计划，列出需要修改的文件和步骤。确认计划后再执行，避免大规模修改出错。

**Agent vs 普通 Chat**：
- Chat 模式：适合快速问答、聊方案思路
- Agent 模式：适合跨文件任务、需要执行命令的场景

## Claude Code 配置与使用

Claude Code 是 Anthropic 官方推出的命令行 AI 工具，2024 年底成为我的新宠。

### 安装与初始化

```bash
# 安装
npm install -g @anthropic-ai/claude-code

# 初始化（首次使用需要登录）
claude
```

### 基础用法

```bash
# 简单对话
claude "解释一下这个项目的目录结构"

# 执行任务
claude "重构 src/utils/request.ts，使用 ofetch 替换 axios"

# 交互模式
claude
> 帮我分析 package.json 中有哪些过时的依赖
```

### CLAUDE.md 项目配置

在项目根目录创建 `CLAUDE.md` 文件，Claude Code 会自动读取：

```markdown
# Project: My Vue App

## Overview
这是一个企业级中后台管理系统，基于 Vue 3 + TypeScript。

## Tech Stack
- Vue 3.4 with Composition API
- TypeScript 5.x (strict mode)
- Vite 5.x
- Pinia for state management
- Vue Router 4
- Element Plus UI
- UnoCSS

## Directory Structure
- `src/api/` - API 请求模块
- `src/components/` - 公共组件
- `src/composables/` - 组合式函数
- `src/stores/` - Pinia stores
- `src/types/` - TypeScript 类型定义
- `src/views/` - 页面组件
- `src/utils/` - 工具函数

## Development Commands
- `pnpm dev` - 启动开发服务器
- `pnpm build` - 生产构建
- `pnpm test` - 运行测试
- `pnpm lint` - 代码检查

## Code Style
- 使用 Composition API + script setup
- 组件文件名使用 PascalCase
- 优先使用 ref 而非 reactive
- API 函数返回 Promise，不在内部 catch 错误

## Important Files
- `src/utils/request.ts` - 封装的请求函数
- `src/stores/user.ts` - 用户状态管理
- `src/router/index.ts` - 路由配置
```

这份配置让 Claude Code 在执行任务时了解项目上下文，输出更符合项目规范。

### Hooks 配置

Claude Code 支持 Hooks，可以在特定事件时执行自定义脚本。配置文件位于 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "postToolUse": [
      {
        "tool": "write_file",
        "command": "pnpm lint:fix $FILE_PATH"
      }
    ]
  }
}
```

这个配置会在 Claude Code 创建/修改文件后自动运行 lint 修复。

### 自定义 Slash 命令

在项目的 `.claude/commands/` 目录下可以创建自定义命令：

```markdown
<!-- .claude/commands/component.md -->
# /component

创建一个新的 Vue 组件。

## 参数
- name: 组件名称（PascalCase）
- type: 组件类型（page | component | layout）

## 模板
根据项目规范创建组件文件，包括：
- 完整的 TypeScript 类型定义
- Props 和 Emits 定义
- 基础的 CSS 结构

## 示例
/component UserCard component
/component Dashboard page
```

使用时：

```bash
claude /component UserProfile component
```

### 实用命令示例

**Review 变更**

```bash
claude "Review 我准备提交的代码变更，检查潜在问题"
```

Claude Code 会自动执行 `git diff` 查看变更内容。

**生成测试**

```bash
claude "给 src/utils/format.ts 生成完整的单元测试"
```

**迁移重构**

```bash
claude "把 src/components 下所有使用 Options API 的组件迁移到 Composition API"
```

**批量修改**

```bash
claude "把所有 console.log 替换成自定义的 logger 函数"
```

**分析依赖**

```bash
claude "分析 package.json，列出所有过时的依赖并给出升级建议"
```

## 实战案例：从 0 到 1 开发一个功能

以"添加深色模式支持"为例，展示我的工作流。

### Step 1: 需求分析（Claude.ai）

首先在 Claude 中讨论技术方案：

```text
我需要给 Vue 3 + UnoCSS 项目添加深色模式支持，要求：
1. 支持手动切换和跟随系统
2. 记住用户选择
3. 避免页面加载时的闪烁

请给出技术方案。
```

Claude 会详细分析几种方案的优缺点，帮我做技术决策。

### Step 2: 生成基础代码（Cursor Composer）

确定方案后，在 Cursor 中用 Composer 生成基础代码：

```text
帮我实现深色模式功能：

1. src/composables/useDarkMode.ts - 深色模式 composable
   - 支持三种模式：light / dark / system
   - 使用 localStorage 持久化
   - 监听系统主题变化

2. src/components/ThemeSwitch.vue - 主题切换组件
   - 显示当前模式
   - 支持三种模式切换

3. 更新 uno.config.ts - 添加 dark mode 配置

4. 更新 src/App.vue - 在根组件初始化主题
```

### Step 3: 细节调整（Cursor Tab 补全）

Composer 生成的代码通常需要微调。我会在编辑器中逐个文件检查，用 Tab 补全来快速完善细节：

```typescript
// useDarkMode.ts
// 需要补充：页面加载时的防闪烁处理
```

Tab 补全会基于上下文生成合适的代码。

### Step 4: 测试与修复（Claude Code）

功能开发完成后，用 Claude Code 生成测试并检查问题：

```bash
# 生成测试
claude "给 useDarkMode.ts 写单元测试"

# 检查潜在问题
claude "Review 深色模式相关的代码，检查是否有边界情况未处理"
```

### Step 5: 提交前 Review

```bash
claude "Review 即将提交的代码，生成 commit message"
```

整个流程下来，一个中等复杂度的功能，从设计到实现到测试，可能只需要 1-2 小时。

## 工具选择指南

不同场景选择不同工具：

| 场景 | 推荐工具 | 原因 |
|------|---------|------|
| 单文件编辑 | Cursor Tab | 最快，无需切换上下文 |
| 小范围重构 | Cursor Cmd+K | 选中代码直接修改 |
| 多文件新功能 | Cursor Composer | 一次生成多个文件 |
| 项目级重构 | Claude Code | 理解整个项目上下文 |
| 批量修改 | Claude Code | 跨文件操作能力强 |
| 技术方案讨论 | Claude | 对话体验好，适合深度讨论 |
| Debug 排查 | Cursor / Claude Code | 都可以，看问题范围 |
| 生成测试 | Claude Code | 能分析被测代码的所有分支 |

## 踩坑经验

### 1. 上下文污染

长时间对话后，AI 可能会"混乱"。解决方案：
- 复杂任务拆分成多个小任务
- 必要时新开对话
- Claude Code 用 `/clear` 清空上下文

### 2. 代码风格不一致

AI 生成的代码可能和项目风格不一致。解决方案：
- 配置好 Rules / CLAUDE.md
- 配置 Hooks 自动运行 lint

### 3. 过度信任

AI 生成的代码看起来对，但可能有隐藏问题：
- 边界条件未处理
- 性能问题
- 类型定义不准确

**原则：生成的代码必须 Review**。

### 4. Token 消耗

项目文件过多时，Claude Code 的 token 消耗很快。优化方式：
- 使用 `.claudeignore` 排除不需要的文件
- 明确指定相关文件路径
- 避免让 AI 扫描整个项目

### 5. 网络问题

国内使用这些工具可能有网络问题。建议：
- 使用稳定的代理
- Claude Code 可以配置代理环境变量

## 效率提升总结

用好这套工具链后，我的工作效率提升体现在：

**时间维度**
- 模板代码：减少 80%+ 的手写时间
- Debug：排查时间缩短 50%+
- 写测试：从最讨厌变成不那么讨厌
- 学新技术：上手时间大幅缩短

**心理维度**
- 不再恐惧重构：AI 能帮忙处理繁琐的部分
- 敢于尝试：实现成本降低了，可以多尝试不同方案
- 更专注：把重复劳动交给 AI，精力放在真正需要思考的地方



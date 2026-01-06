---
title: Electron 应用安全加固指南
description: 全面介绍 Electron 应用的安全风险和防护措施
date: 2024-11-05
lang: zh
duration: 15min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

Electron 应用本质上是运行在用户本地的 Web 应用，但它拥有比浏览器更高的系统权限。这种能力带来便利的同时，也带来了更大的安全风险。本文将系统介绍 Electron 应用的安全最佳实践。

## 安全风险概述

### 常见攻击向量

1. **远程代码执行 (RCE)** - 攻击者通过注入代码获取系统权限
2. **跨站脚本 (XSS)** - 在渲染进程中执行恶意脚本
3. **原型链污染** - 通过修改原型链劫持程序行为
4. **不安全的 IPC** - 主进程暴露危险的系统操作

### 风险来源

风险从多个入口进入应用，最终可能获取系统权限：

**用户输入 / 外部网页 / 第三方库** → **渲染进程** → **IPC** → **主进程** → **系统 API**

## 核心安全配置

### 1. 禁用 Node.js 集成

```typescript
// ❌ 危险配置
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,  // 渲染进程可以直接使用 Node.js
    contextIsolation: false // 无上下文隔离
  }
})

// ✅ 安全配置
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,    // 禁用 Node.js
    contextIsolation: true,    // 启用上下文隔离
    sandbox: true,             // 启用沙箱
    webSecurity: true,         // 启用同源策略
    allowRunningInsecureContent: false
  }
})
```

### 2. 上下文隔离

上下文隔离确保预加载脚本和渲染进程在不同的 JavaScript 上下文中运行：

```typescript
// preload.ts - 预加载脚本
import { contextBridge, ipcRenderer } from 'electron'

// 只暴露必要的、安全的 API
contextBridge.exposeInMainWorld('api', {
  // 安全：只暴露特定功能，不暴露整个 ipcRenderer
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) =>
    ipcRenderer.invoke('write-file', path, content)
})

// ❌ 危险：暴露整个 ipcRenderer
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer  // 攻击者可以调用任意 IPC 方法
})
```

### 3. 启用沙箱模式

```typescript
// 应用级别启用沙箱
app.enableSandbox()

// 或在窗口级别
new BrowserWindow({
  webPreferences: {
    sandbox: true
  }
})
```

沙箱模式限制：
- 无法使用 Node.js API
- 无法访问文件系统
- 进程间通信受限

## IPC 通信安全

### 验证所有输入

```typescript
// main.ts
import { ipcMain, BrowserWindow } from 'electron'
import path from 'path'
import { z } from 'zod'

// 定义输入 Schema
const ReadFileSchema = z.object({
  filePath: z.string().min(1).max(500)
})

// 定义允许访问的目录
const ALLOWED_DIRS = [
  app.getPath('userData'),
  app.getPath('documents')
]

function isPathSafe(filePath: string): boolean {
  const normalized = path.normalize(filePath)
  return ALLOWED_DIRS.some(dir => normalized.startsWith(dir))
}

ipcMain.handle('read-file', async (event, rawParams) => {
  // 1. 验证发送者
  const sender = event.sender
  const window = BrowserWindow.fromWebContents(sender)

  if (!window || window.isDestroyed()) {
    throw new Error('Invalid sender')
  }

  // 2. 验证输入格式
  const result = ReadFileSchema.safeParse(rawParams)
  if (!result.success) {
    throw new Error('Invalid parameters')
  }

  const { filePath } = result.data

  // 3. 验证路径安全
  if (!isPathSafe(filePath)) {
    throw new Error('Access denied: path not allowed')
  }

  // 4. 执行操作
  return fs.readFile(filePath, 'utf-8')
})
```

### 避免暴露危险 API

```typescript
// ❌ 危险：允许执行任意命令
ipcMain.handle('execute-command', (_, cmd) => {
  return exec(cmd)  // 攻击者可以执行任意系统命令
})

// ❌ 危险：允许访问任意文件
ipcMain.handle('read-file', (_, path) => {
  return fs.readFile(path)  // 攻击者可以读取系统敏感文件
})

// ✅ 安全：限定功能范围
ipcMain.handle('get-user-config', async () => {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  return fs.readFile(configPath, 'utf-8')
})

ipcMain.handle('save-user-config', async (_, config: unknown) => {
  // 验证 config 格式
  const validated = ConfigSchema.parse(config)
  const configPath = path.join(app.getPath('userData'), 'config.json')
  await fs.writeFile(configPath, JSON.stringify(validated))
})
```

## 远程内容安全

### 禁止加载远程内容

```typescript
// 如果应用不需要加载远程网页
new BrowserWindow({
  webPreferences: {
    // 禁用远程模块（已废弃但可能存在）
    enableRemoteModule: false
  }
})

// 限制导航
window.webContents.on('will-navigate', (event, url) => {
  const parsedUrl = new URL(url)

  // 只允许应用内导航
  if (parsedUrl.protocol !== 'file:') {
    event.preventDefault()
  }
})

// 禁止打开新窗口
window.webContents.setWindowOpenHandler(({ url }) => {
  // 外部链接用默认浏览器打开
  if (url.startsWith('https://')) {
    shell.openExternal(url)
  }
  return { action: 'deny' }
})
```

### 内容安全策略 (CSP)

```typescript
// 设置 CSP 响应头
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.example.com"
      ].join('; ')
    }
  })
})

// 或在 HTML 中
// <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
```

## 依赖安全

### 定期审计依赖

```bash
# npm 审计
npm audit

# 自动修复
npm audit fix

# 使用 snyk
npx snyk test
```

### 锁定依赖版本

```json
// package.json
{
  "dependencies": {
    "electron": "28.0.0"  // 使用精确版本
  },
  "overrides": {
    // 强制修复有漏洞的传递依赖
    "vulnerable-package": "^2.0.0"
  }
}
```

### 保持 Electron 更新

```typescript
// 检查 Electron 版本
const { app } = require('electron')
console.log(`Electron version: ${process.versions.electron}`)
console.log(`Chrome version: ${process.versions.chrome}`)
console.log(`Node version: ${process.versions.node}`)
```

## 代码保护

### 源码保护

```typescript
// 使用 asar 打包（默认行为）
// electron-builder.yml
asar: true
asarUnpack:
  - "**/*.node"  # 原生模块不打包

// 代码混淆（构建时）
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: true,
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      })
    ]
  }
}
```

### 防止调试

```typescript
// 生产环境禁用 DevTools
if (app.isPackaged) {
  app.on('browser-window-created', (_, window) => {
    window.webContents.on('devtools-opened', () => {
      window.webContents.closeDevTools()
    })
  })
}

// 禁用快捷键
window.webContents.on('before-input-event', (event, input) => {
  if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
    event.preventDefault()
  }
})
```

## 安全检查清单

### 配置检查

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: true`
- `allowRunningInsecureContent: false`

### IPC 检查

- 所有 IPC handler 验证输入
- 文件路径访问有白名单限制
- 没有暴露危险的系统 API
- 验证 IPC 消息发送者

### 内容检查

- 设置了 CSP
- 限制了导航和新窗口
- 外部链接使用系统浏览器打开

### 依赖检查

- 定期运行 `npm audit`
- Electron 版本保持更新
- 没有使用已废弃的 API

## 总结

Electron 安全的核心原则：

1. **最小权限** - 只暴露必要的 API
2. **纵深防御** - 多层安全措施叠加
3. **输入验证** - 不信任任何外部输入
4. **持续更新** - 保持依赖和框架更新

安全不是一次性工作，而是需要持续关注的过程。建议将安全检查纳入 CI/CD 流程，定期进行安全审计。

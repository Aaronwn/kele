---
title: React Native (Expo) 标准开发流程
description: 基于 React Native 快速开发跨端应用
date: 2025-01-06
lang: zh
duration: 10min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

基于番茄钟项目的实践总结，供 AI Coding Agent 快速开发参考。

---

## 1. 项目初始化

```bash
# 创建 Expo 项目
npx create-expo-app@latest my-app
cd my-app

# 安装常用依赖
npx expo install expo-router react-native-safe-area-context react-native-screens
npx expo install zustand @react-native-async-storage/async-storage
```

## 2. 推荐项目结构

```json
app/                    # Expo Router 路由（文件即路由）
  (tabs)/               # Tab 导航组
    _layout.tsx         # Tab 布局配置
    index.tsx           # 首页
    settings.tsx        # 设置页
  _layout.tsx           # 根布局
src/
  components/           # 按功能分组的组件
    Feature/
      Component.tsx
  stores/               # Zustand 状态管理
    featureStore.ts
  hooks/                # 自定义 Hooks
  types/                # TypeScript 类型定义
  utils/                # 工具函数
  constants/            # 常量配置
  theme/                # 主题样式（可选）
```

## 3. 技术栈选择

| 领域 | 推荐方案 | 说明 |
|------|---------|------|
| 框架 | Expo SDK | 简化原生配置 |
| 路由 | expo-router | 文件系统路由 |
| 状态管理 | Zustand | 轻量、简单 |
| 持久化 | AsyncStorage + Zustand persist | 自动持久化 |
| 样式 | StyleSheet | 原生方案，性能好 |

## 4. 关键配置

### tsconfig.json - 路径别名
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

### app.json - Expo 配置要点
```json
{
  "expo": {
    "scheme": "my-app",        // Deep linking
    "plugins": ["expo-router"]
  }
}
```

### package.json
```json
{
  "main": "expo-router/entry"  // 使用 expo-router 入口
}
```

## 5. 常见问题与解决

### 依赖缺失
```bash
# 始终使用 expo install 安装依赖（自动匹配 SDK 版本）
npx expo install <package-name>
```

### Zustand 无限循环
```tsx
// ❌ 错误 - selector 中调用返回新对象的方法
const data = useStore((state) => state.getData());

// ✅ 正确 - 选取原始状态 + useMemo 计算
const records = useStore((state) => state.records);
const data = useMemo(() => compute(records), [records]);
```

### 清除缓存
```bash
npx expo start -c
```

## 6. 开发与调试

```bash
npm start              # 启动开发服务器
# 手机安装 Expo Go，扫描二维码即可预览
```

## 7. 构建发布

```bash
# 安装 EAS CLI
npm install -g eas-cli
eas login

# 构建
eas build --platform android --profile preview  # Android APK
eas build --platform ios --profile preview      # iOS (需开发者账号)
```

## 线上效果
<div style="display: flex; gap: 16px; align-items: center;">
  <img src="/images/tomato.png" alt="番茄图片" style="width: 200px;">
  <img src="/images/tomato2.png" alt="番茄图片2" style="width: 200px;">
  <img src="/images/tomato3.png" alt="番茄图片3" style="width: 200px;">
</div>



---

## 给 AI Agent 的提示模板

```json
请帮我开发一个 React Native 应用，要求：
1. 使用 Expo + expo-router + TypeScript
2. 状态管理用 Zustand，需要持久化的用 AsyncStorage
3. 项目结构：app/ 放路由，src/ 放业务代码
4. 先规划功能模块和数据结构，再逐步实现
5. 每完成一个功能就测试验证

功能需求：
- [描述你的应用功能]
```

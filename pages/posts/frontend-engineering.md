---
title: 前端工程化：构建高效的开发工作流
description: 从代码规范到 CI/CD，打造现代化的前端工程体系
date: 2024-10-20
lang: zh
duration: 18min
subtitle: 'Author: Kele'
---

[[toc]]

## 前言

前端工程化是将软件工程的方法论应用到前端开发中，目标是提高开发效率、保证代码质量、降低维护成本。本文将从多个维度分享如何构建现代化的前端工程体系。

## 代码规范

### ESLint 配置

```javascript
// eslint.config.js (ESLint 9+ 扁平配置)
import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // 通用规则
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.vue'],
    plugins: { vue },
    processor: vue.processors['.vue'],
    rules: {
      ...vue.configs['vue3-recommended'].rules,
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn'
    }
  },
  prettier  // 放最后，禁用与 Prettier 冲突的规则
]
```

### Prettier 配置

```javascript
// prettier.config.js
export default {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  vueIndentScriptAndStyle: false
}
```

### EditorConfig

```ini
# .editorconfig
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

## Git 规范

### Commit Message 规范

```bash
# 安装 commitizen
npm install -D commitizen cz-conventional-changelog

# package.json
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

提交格式：
```text
<type>(<scope>): <subject>

<body>

<footer>
```

常用 type：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建或辅助工具变动

### Husky + lint-staged

```bash
# 安装
npm install -D husky lint-staged

# 初始化 husky
npx husky init
```

```javascript
// package.json
{
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,less}": [
      "stylelint --fix",
      "prettier --write"
    ],
    "*.md": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged

# .husky/commit-msg
npx commitlint --edit $1
```

### Commitlint

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert']
    ],
    'subject-max-length': [2, 'always', 72]
  }
}
```

## 构建优化

### Vite 配置优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    // 包体积分析
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    }),
    // Gzip 压缩
    viteCompression({
      algorithm: 'gzip',
      threshold: 10240
    })
  ],

  build: {
    // 分包策略
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['element-plus'],
          'utils': ['lodash-es', 'dayjs']
        }
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 关闭 source map（生产环境）
    sourcemap: false,
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 500
  },

  // 依赖预构建
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios']
  }
})
```

### 图片优化

```typescript
// vite.config.ts
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false }
        ]
      },
      webp: { quality: 75 }
    })
  ]
})
```

## 测试体系

### 单元测试 (Vitest)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
})
```

```typescript
// tests/utils/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate, formatMoney } from '@/utils/format'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('2024-01-15')
  })

  it('should handle invalid date', () => {
    expect(formatDate(null)).toBe('-')
  })
})

describe('formatMoney', () => {
  it('should format with default precision', () => {
    expect(formatMoney(1234.567)).toBe('1,234.57')
  })

  it('should handle custom precision', () => {
    expect(formatMoney(1234.5, 0)).toBe('1,235')
  })
})
```

### 组件测试

```typescript
// tests/components/Button.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/ui/Button.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' }
    })
    expect(wrapper.text()).toContain('Click me')
  })

  it('emits click event', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('disables button when loading', () => {
    const wrapper = mount(Button, {
      props: { loading: true }
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
})
```

### E2E 测试 (Playwright)

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('successful login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="welcome"]')).toContainText('Welcome')
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[data-testid="email"]', 'wrong@example.com')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    await page.click('[data-testid="submit"]')

    await expect(page.locator('[data-testid="error"]')).toBeVisible()
  })
})
```

## CI/CD 流程

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/

      - name: Deploy to server
        run: |
          # 部署脚本
          rsync -avz dist/ user@server:/var/www/app/
```

## 监控与错误追踪

### Sentry 集成

```typescript
// src/main.ts
import * as Sentry from '@sentry/vue'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration({ router }),
    Sentry.replayIntegration()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE
})

app.use(router).mount('#app')
```

### 性能监控

```typescript
// src/utils/performance.ts
export function reportWebVitals() {
  if ('web-vital' in window) return

  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS(sendToAnalytics)
    onFID(sendToAnalytics)
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
  })
}

function sendToAnalytics(metric: { name: string; value: number }) {
  // 上报到监控平台
  console.log(`[Web Vitals] ${metric.name}: ${metric.value}`)

  // 例如发送到 Google Analytics
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    metric_id: metric.id
  })
}
```

## 文档自动化

### VitePress 文档

```typescript
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '项目文档',
  description: '前端项目开发文档',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/' },
      { text: '组件', link: '/components/' },
      { text: 'API', link: '/api/' }
    ],
    sidebar: {
      '/guide/': [
        { text: '快速开始', link: '/guide/getting-started' },
        { text: '项目结构', link: '/guide/structure' },
        { text: '开发规范', link: '/guide/conventions' }
      ]
    }
  }
})
```

### TypeDoc API 文档

```json
// typedoc.json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "exclude": ["**/*.test.ts", "**/node_modules/**"],
  "excludePrivate": true,
  "excludeProtected": true
}
```

## 总结

前端工程化的核心要素：

1. **规范先行** - ESLint + Prettier + Git Hooks 保证代码质量
2. **自动化测试** - 单元测试 + E2E 测试构建安全网
3. **CI/CD 流水线** - 自动化构建、测试、部署
4. **监控体系** - 错误追踪 + 性能监控及时发现问题
5. **文档沉淀** - 自动化生成 API 文档和开发指南

工程化不是一蹴而就的，需要根据团队规模和项目复杂度逐步完善。重要的是建立持续改进的意识。

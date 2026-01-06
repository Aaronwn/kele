---
title: Electron 应用架构设计与进程通信
description: 深入理解 Electron 多进程架构，掌握进程间通信的最佳实践
date: 2024-12-05T10:00:00.000+00:00
lang: zh
duration: 18min
subtitle: "Author: Kele"
---

[[toc]]

## 前言

Electron 让我们能够使用 Web 技术构建跨平台桌面应用。然而，Electron 的多进程架构与传统 Web 开发有着本质区别。理解并正确设计进程通信是构建高质量 Electron 应用的关键。

## 进程架构

### 主进程与渲染进程

Electron 应用采用多进程架构，包含一个主进程和多个渲染进程。

#### 主进程（Main Process）

主进程是应用的核心，运行在 Node.js 环境中，负责系统级操作。它拥有完整的 Node.js API 访问权限，可以调用操作系统 API、管理应用窗口的创建与销毁、控制应用的生命周期（启动、退出、激活等）。每个 Electron 应用有且仅有一个主进程。

#### 渲染进程（Renderer Process）

渲染进程负责显示用户界面，每个窗口对应一个独立的渲染进程。渲染进程运行在 Web 环境中，类似于浏览器中的网页，可以使用 HTML、CSS 和 JavaScript 构建界面。但与普通网页不同，渲染进程通过 IPC（Inter-Process Communication）与主进程通信，从而间接访问系统资源。

#### 进程通信

主进程与渲染进程之间通过 IPC 机制进行双向通信。主进程可以创建多个窗口，每个窗口都有自己独立的渲染进程，这些渲染进程之间相互隔离，互不影响。

### 进程职责划分

**主进程负责：**

- 应用生命周期管理
- 窗口创建与管理
- 系统级功能（菜单、托盘、快捷键）
- 文件系统操作
- 与操作系统交互

**渲染进程负责：**

- 用户界面渲染
- 用户交互处理
- 业务逻辑（受限）

## 项目结构设计

```text
electron-app/
├── src/
│   ├── main/                 # 主进程代码
│   │   ├── index.ts          # 入口
│   │   ├── windows/          # 窗口管理
│   │   │   ├── main.ts
│   │   │   └── preferences.ts
│   │   ├── ipc/              # IPC 处理
│   │   │   ├── handlers.ts
│   │   │   └── channels.ts
│   │   └── services/         # 主进程服务
│   │       ├── store.ts
│   │       └── updater.ts
│   │
│   ├── preload/              # 预加载脚本
│   │   └── index.ts
│   │
│   ├── renderer/             # 渲染进程（Vue/React）
│   │   ├── main.ts
│   │   ├── App.vue
│   │   └── ...
│   │
│   └── shared/               # 共享类型和常量
│       ├── types.ts
│       └── channels.ts
│
├── electron.vite.config.ts
└── package.json
```

## 进程通信模式

### 基础 IPC 通信

```typescript
// shared/channels.ts - 定义通道常量
export const IPC_CHANNELS = {
  GET_USER_DATA: "get-user-data",
  SAVE_FILE: "save-file",
  OPEN_DIALOG: "open-dialog",
  APP_QUIT: "app-quit",
} as const;

// shared/types.ts - 定义类型
export interface UserData {
  id: string;
  name: string;
  preferences: Record<string, unknown>;
}

export interface SaveFileParams {
  content: string;
  filePath: string;
}
```

### 主进程 Handler

```typescript
// main/ipc/handlers.ts
import { ipcMain, dialog, BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/channels";
import type { SaveFileParams, UserData } from "../../shared/types";

export function setupIpcHandlers() {
  // 处理获取用户数据
  ipcMain.handle(IPC_CHANNELS.GET_USER_DATA, async (): Promise<UserData> => {
    // 从存储中读取
    return store.get("userData");
  });

  // 处理保存文件
  ipcMain.handle(
    IPC_CHANNELS.SAVE_FILE,
    async (_, params: SaveFileParams): Promise<boolean> => {
      try {
        await fs.writeFile(params.filePath, params.content, "utf-8");
        return true;
      } catch (error) {
        console.error("Save file error:", error);
        return false;
      }
    }
  );

  // 处理打开对话框
  ipcMain.handle(IPC_CHANNELS.OPEN_DIALOG, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(window!, {
      properties: ["openFile"],
      filters: [{ name: "All Files", extensions: ["*"] }],
    });
    return result.filePaths[0] || null;
  });
}
```

### Preload 脚本

```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/channels";
import type { SaveFileParams, UserData } from "../shared/types";

// 定义暴露给渲染进程的 API
const electronAPI = {
  // 调用主进程方法
  getUserData: (): Promise<UserData> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_USER_DATA);
  },

  saveFile: (params: SaveFileParams): Promise<boolean> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SAVE_FILE, params);
  },

  openDialog: (): Promise<string | null> => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_DIALOG);
  },

  // 监听主进程事件
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    const subscription = (_: unknown, info: UpdateInfo) => callback(info);
    ipcRenderer.on("update-available", subscription);
    return () => ipcRenderer.removeListener("update-available", subscription);
  },

  // 应用控制
  quit: () => ipcRenderer.send(IPC_CHANNELS.APP_QUIT),
};

// 暴露到 window 对象
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// 类型声明
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
```

### 渲染进程调用

```typescript
// renderer/composables/useElectron.ts (Vue)
export function useElectron() {
  const api = window.electronAPI;

  async function saveFile(content: string, filePath: string) {
    const success = await api.saveFile({ content, filePath });
    if (!success) {
      throw new Error("Failed to save file");
    }
  }

  async function selectFile() {
    return api.openDialog();
  }

  return {
    saveFile,
    selectFile,
    getUserData: api.getUserData,
    quit: api.quit,
  };
}

// 在组件中使用
const { saveFile, selectFile } = useElectron();

async function handleSave() {
  const filePath = await selectFile();
  if (filePath) {
    await saveFile(editor.value, filePath);
  }
}
```

## 窗口管理

### 窗口工厂模式

```typescript
// main/windows/WindowManager.ts
import { BrowserWindow, shell } from "electron";
import path from "path";

interface WindowConfig {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  show?: boolean;
}

class WindowManager {
  private windows = new Map<string, BrowserWindow>();

  create(id: string, config: WindowConfig): BrowserWindow {
    if (this.windows.has(id)) {
      const existing = this.windows.get(id)!;
      existing.focus();
      return existing;
    }

    const window = new BrowserWindow({
      ...config,
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    // 外部链接在默认浏览器打开
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("https:")) {
        shell.openExternal(url);
      }
      return { action: "deny" };
    });

    window.on("closed", () => {
      this.windows.delete(id);
    });

    this.windows.set(id, window);
    return window;
  }

  get(id: string): BrowserWindow | undefined {
    return this.windows.get(id);
  }

  getAll(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  closeAll() {
    this.windows.forEach((window) => window.close());
  }
}

export const windowManager = new WindowManager();
```

### 多窗口通信

```typescript
// main/ipc/broadcast.ts
import { windowManager } from "../windows/WindowManager";

// 向所有窗口广播消息
export function broadcast(channel: string, data: unknown) {
  windowManager.getAll().forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data);
    }
  });
}

// 使用场景：主题切换
ipcMain.on("theme-changed", (_, theme: string) => {
  store.set("theme", theme);
  broadcast("theme-changed", theme);
});
```

## 数据持久化

### 使用 electron-store

```typescript
// main/services/store.ts
import Store from "electron-store";

interface StoreSchema {
  userData: {
    id: string;
    name: string;
  } | null;
  preferences: {
    theme: "light" | "dark";
    language: string;
    autoUpdate: boolean;
  };
  recentFiles: string[];
}

export const store = new Store<StoreSchema>({
  defaults: {
    userData: null,
    preferences: {
      theme: "light",
      language: "zh-CN",
      autoUpdate: true,
    },
    recentFiles: [],
  },
  // 数据加密（可选）
  encryptionKey: process.env.STORE_KEY,
});

// 封装常用操作
export const preferences = {
  get: () => store.get("preferences"),
  set: (prefs: Partial<StoreSchema["preferences"]>) => {
    store.set("preferences", { ...store.get("preferences"), ...prefs });
  },
};

export const recentFiles = {
  add: (filePath: string) => {
    const files = store.get("recentFiles");
    const updated = [filePath, ...files.filter((f) => f !== filePath)].slice(
      0,
      10
    );
    store.set("recentFiles", updated);
  },
  get: () => store.get("recentFiles"),
  clear: () => store.set("recentFiles", []),
};
```

## 安全实践

### Context Isolation

```typescript
// 始终启用上下文隔离
new BrowserWindow({
  webPreferences: {
    contextIsolation: true, // 隔离预加载脚本
    nodeIntegration: false, // 禁用 Node.js
    sandbox: true, // 启用沙箱
    webSecurity: true, // 启用同源策略
  },
});
```

### 输入验证

```typescript
// main/ipc/handlers.ts
ipcMain.handle("save-file", async (_, params: unknown) => {
  // 验证输入
  if (!isValidSaveParams(params)) {
    throw new Error("Invalid parameters");
  }

  // 验证路径安全
  const { filePath, content } = params as SaveFileParams;
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(app.getPath("userData"))) {
    throw new Error("Invalid file path");
  }

  await fs.writeFile(normalizedPath, content);
});

function isValidSaveParams(params: unknown): params is SaveFileParams {
  return (
    typeof params === "object" &&
    params !== null &&
    "filePath" in params &&
    "content" in params &&
    typeof (params as SaveFileParams).filePath === "string" &&
    typeof (params as SaveFileParams).content === "string"
  );
}
```

## 性能优化

### 延迟加载模块

```typescript
// main/index.ts
app.whenReady().then(async () => {
  // 先显示窗口
  const mainWindow = createMainWindow();
  mainWindow.show();

  // 后台加载耗时模块
  const { setupAutoUpdater } = await import("./services/updater");
  setupAutoUpdater();
});
```

### 渲染进程优化

```typescript
// 使用 requestIdleCallback 执行非关键任务
window.requestIdleCallback(() => {
  // 预加载不紧急的数据
  prefetchData();
});

// 使用 Web Workers 处理计算密集任务
const worker = new Worker(new URL("./heavy-task.worker.ts", import.meta.url));
worker.postMessage({ data: largeData });
worker.onmessage = (e) => {
  result.value = e.data;
};
```

## 总结

Electron 应用架构设计要点：

1. **职责分离** - 主进程管理系统交互，渲染进程负责 UI
2. **类型安全** - 使用 TypeScript 定义 IPC 通道和消息类型
3. **安全优先** - 启用 contextIsolation，验证所有输入
4. **模块化** - 窗口管理、IPC 处理、数据存储独立封装
5. **性能意识** - 延迟加载、合理使用 Web Workers

掌握这些模式，你就能构建出稳定、安全、高性能的 Electron 桌面应用。

# webexter

基于 Vite 8 + Manifest V3 的跨平台浏览器扩展脚手架工具。

## 功能特性

- **框架支持** — React 19 或 Vue 3，提供 TypeScript 和 JavaScript 两种语言选项
- **模块化脚手架** — 按需选择页面：background、content script、popup、options、side panel、new tab page、devtools
- **跨平台构建** — 通过 `--mode` 标志即可构建 Chrome、Firefox 或任意 Chromium 内核浏览器版本
- **Firefox 兼容** — 自动处理清单文件差异（`browser_specific_settings`、`sidebar_action`、`options_ui`）
- **热更新支持** — 扩展页面开箱即用的热模块替换
- **WebSocket CSP** — 内容安全策略已预配置，支持扩展 HMR 连接
- **`webextension-polyfill`** — 预装跨浏览器 API 兼容层

## 快速开始

```bash
npx webexter create my-extension
cd my-extension
pnpm install
pnpm dev       # 开发模式 (Chrome)
```

然后在浏览器中加载 `dist` 文件夹作为未打包扩展程序。

## 使用方法

```bash
webexter create <项目名称>
```

按提示操作：

1. **框架** — React / Vue
2. **语言** — TypeScript / JavaScript
3. **模块** — 多选所需页面（默认：popup + background）

### 可用模块

| 模块 | 描述 | Manifest Key |
|---|---|---|
| Background (Service Worker) | 扩展后台服务 worker | `background.service_worker` |
| Content Script | 注入到网页的脚本 | `content_scripts` |
| Popup | 浏览器工具栏弹出窗口 | `action.default_popup` |
| Options Page | 扩展设置页面 | `options_page` |
| Side Panel | 浏览器侧边栏面板 | `side_panel` |
| New Tab Page | 新标签页 | `chrome_url_overrides.newtab` |
| DevTools Page | DevTools 扩展面板 | `devtools_page` |

## 构建命令

| 命令 | 模式 | 输出 |
|---|---|---|
| `pnpm dev` | default | 开发模式 (Chrome) |
| `pnpm dev:chrome` | chrome | 开发模式 (Chrome) |
| `pnpm dev:firefox` | firefox | 开发模式 (Firefox) |
| `pnpm build` | production | 生产构建 |
| `pnpm build:chrome` | chrome | 生产构建 (Chrome) |
| `pnpm build:firefox` | firefox | 生产构建 (Firefox) |

`pnpm dev` 启动带 HMR 的 Vite 开发服务器。在浏览器中加载 `dist/` 作为未打包扩展程序。

`pnpm build` 在 `dist/` 中生成生产构建产物。

使用 `--mode <name>` 可针对任意 Chromium 内核浏览器（如 `--mode qq`、`--mode edge`）。只有 `firefox` 模式会触发 Firefox 特定的清单转换，其他模式均使用标准 Chrome 清单格式。

## 生成的项目结构

```
my-extension/
├── package.json
├── vite.config.ts
├── manifest.json
├── tsconfig.json / jsconfig.json
├── .env
├── .env.firefox
└── src/
    ├── env.d.ts              # (仅 TypeScript)
    ├── background/
    │   └── index.ts
    ├── content/
    │   └── index.ts
    ├── popup/
    │   ├── index.html
    │   ├── main.tsx
    │   └── App.tsx
    ├── options/
    │   ├── index.html
    │   ├── main.tsx
    │   └── App.tsx
    ├── sidepanel/
    │   ├── index.html
    │   ├── main.tsx
    │   └── App.tsx
    ├── newtab/
    │   ├── index.html
    │   ├── main.tsx
    │   └── App.tsx
    ├── devtools/
    │   ├── index.html
    │   ├── devtools.ts
    │   └── devtools.js
    ├── public/
    └── ...
```

仅生成所选的模块。

## Firefox 兼容性

使用 `--mode firefox` 构建时，以下清单转换会自动应用：

| 功能 | Chrome | Firefox |
|---|---|---|
| 插件 ID | 不需要 | `browser_specific_settings.gecko.id` |
| 侧边栏面板 | `side_panel` | `sidebar_action` |
| 选项页面 | `options_page` | `options_ui`（带 `open_in_tab`）|

`webextension-polyfill` 包提供跨浏览器 API 兼容性（在所有浏览器中使用 `browser.*` API）。

## 环境变量

| 变量 | 用途 |
|---|---|
| `VITE_FIREFOX_ID` | Firefox 插件 ID（默认：`<project>@example.com`）|

在 `.env`（通用）或 `.env.firefox`（仅 Firefox）中定义自定义变量。

## License

MIT
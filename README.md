# webexter

A scaffolding CLI for building cross-platform browser extensions with Vite 8 + Manifest V3.

## Features

- **Framework support** — React 19 or Vue 3, with TypeScript or JavaScript
- **Modular scaffolding** — Select only the pages you need: background, content script, popup, options, side panel, new tab page, devtools
- **Cross-platform builds** — Single `--mode` flag to build for Chrome, Firefox, or any Chromium-based browser
- **Firefox compatibility** — Automatically handles manifest differences (`browser_specific_settings`, `sidebar_action`, `options_ui`)
- **HMR-ready** — Hot module replacement works out of the box for extension pages
- **Build + zip packaging** — Integrated `vite-plugin-zip-pack` for release archives
- **WebSocket CSP** — Content Security Policy preconfigured for extension HMR connections
- **`webextension-polyfill`** — Pre-installed for cross-browser API compatibility

## Quick Start

```bash
npx webexter create my-extension
cd my-extension
pnpm install
pnpm dev       # development (Chrome)
```

Then load the `dist` folder as an unpacked extension in your browser.

## Usage

```bash
webexter create <project-name>
```

Follow the interactive prompts:

1. **Framework** — React / Vue
2. **Language** — TypeScript / JavaScript
3. **Modules** — Multi-select the pages you need (default: popup + background)

### Available Modules

| Module | Description | Manifest Key |
|---|---|---|
| Background (Service Worker) | Extension background service worker | `background.service_worker` |
| Content Script | Script injected into web pages | `content_scripts` |
| Popup | Browser toolbar popup | `action.default_popup` |
| Options Page | Extension settings page | `options_page` |
| Side Panel | Browser side panel | `side_panel` |
| New Tab Page | Override the new tab page | `chrome_url_overrides.newtab` |
| DevTools Page | DevTools extension panel | `devtools_page` |

## Build Commands

| Command | Mode | Output |
|---|---|---|
| `pnpm dev` | default | Development (Chrome) |
| `pnpm dev:chrome` | chrome | Development (Chrome) |
| `pnpm dev:firefox` | firefox | Development (Firefox) |
| `pnpm build` | production | Production build |
| `pnpm build:chrome` | chrome | Production build (Chrome) |
| `pnpm build:firefox` | firefox | Production build (Firefox) |
| `pnpm pack` | production | Production build + zip |
| `pnpm pack:chrome` | chrome | Production build + zip (Chrome) |
| `pnpm pack:firefox` | firefox | Production build + zip (Firefox) |

`pnpm dev` starts a Vite dev server with HMR. Load `dist/` as an unpacked extension in your browser.

`pnpm build` produces a production build in `dist/`.

`pnpm pack` runs the build and packages `dist/` into a zip archive in `release/`.

Use `--mode <name>` for any Chromium-based browser (e.g. `--mode qq`, `--mode edge`). Only `firefox` mode triggers Firefox-specific manifest transforms; all other modes use standard Chrome manifest format.

## Generated Project Structure

```
my-extension/
├── package.json
├── vite.config.ts
├── manifest.json
├── tsconfig.json / jsconfig.json
├── .env
├── .env.firefox
└── src/
    ├── env.d.ts              # (TypeScript only)
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

Only selected modules are generated.

## Firefox Compatibility

When building with `--mode firefox`, the following manifest transformations are applied automatically:

| Feature | Chrome | Firefox |
|---|---|---|
| Add-on ID | not required | `browser_specific_settings.gecko.id` |
| Side panel | `side_panel` | `sidebar_action` |
| Options page | `options_page` | `options_ui` (with `open_in_tab`) |

The `webextension-polyfill` package provides cross-browser API compatibility (`browser.*` API in all browsers).

## Environment Variables

| Variable | Used for |
|---|---|
| `VITE_FIREFOX_ID` | Firefox add-on ID (default: `<project>@example.com`) |

Define custom variables in `.env` (shared) or `.env.firefox` (Firefox only).

## License

MIT

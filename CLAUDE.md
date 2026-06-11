# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`webexter` is a scaffolding CLI tool that generates browser extension projects using Vite 8 + Manifest V3. It supports React 19 or Vue 3, TypeScript or JavaScript, and multiple extension modules (background, content, popup, options, sidepanel, etc.).

## Build Commands

```bash
pnpm dev        # Run CLI in development mode (tsx src/cli.ts)
pnpm build      # Compile TypeScript to dist/ and copy templates
pnpm build:link # Build and link globally via pnpm link --global
```

No test or lint framework is currently configured.

## Architecture

### CLI Flow

1. `src/cli.ts` - Entry point using commander.js, exposes the `create` command
2. `src/commands/create.ts` - Project scaffolding logic:
   - Prompts user for framework (React/Vue), language (TS/JS), modules, Tailwind option
   - Generates `manifest.json` based on selected modules
   - Copies template and injects polyfills
3. `src/utils/`:
   - `files.ts` - File operations (ensureDir, copyDir, writeFile)
   - `manifest.ts` - Manifest.json generation with Firefox compatibility transforms
   - `prompts.ts` - Interactive prompts

### Templates

Templates live in `src/templates/` with four variants: `react-js/`, `react-ts/`, `vue-js/`, `vue-ts/`.

Each template uses:
- `@crxjs/vite-plugin` for CRX/extension HMR support
- `webextension-polyfill` for cross-browser API compatibility
- `@webext-core/storage` for typed storage

### Firefox Compatibility

The manifest generator applies transforms for Firefox:
- Injects `browser_specific_settings.gecko.id` as `${projectName}@example.com`
- Converts `side_panel` to `sidebar_action`
- Converts `options_page` to `options_ui`

## Key Conventions

- **ES Modules**: Project uses `"type": "module"`, so imports require `.js` extensions
- **Template paths**: Resolved via `import.meta.dirname`
- **Default modules**: If none selected, defaults to `popup` + `background`
- **Polyfill injection**: Automatically added to `background` and `content` entry files

## TypeScript Config

- Target: ES2022, module: nodenext, strict mode
- Excludes: `node_modules`, `dist`, `src/templates`
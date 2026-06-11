#!/usr/bin/env node

import { Command } from 'commander'
import { create } from './commands/create.js'
import pkg from '../package.json' with { type: 'json' }

const program = new Command()

program
  .name('webexter')
  .description(`
A scaffolding CLI for quickly building browser extensions based on Vite 8 + Manifest V3.

Supported frameworks: React 19, Vue 3
Supported languages: TypeScript, JavaScript
Supported browsers: Chrome, Firefox, and other Chromium-based browsers

Features:
  • Hot Module Replacement (HMR) for fast development
  • Cross-browser extension support with WebExtension Polyfill
  • Multiple extension modules: background, content, popup, options, sidepanel, newtab, devtools
  • Optional Tailwind CSS v4 support
  • TypeScript support with full type definitions
  • Firefox-specific manifest transformations`)
  .version(pkg.version)
  .usage(`
Examples:
  webexter create my-extension        Create a new extension project
  webexter --help                     Show this help message
  webexter create --help             Show create command options`)

program
  .command('create <name>')
  .description('Create a new browser extension project')
  .action(async (name: string) => {
    await create(name)
  })

program.parse()
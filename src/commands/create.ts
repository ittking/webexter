import path from 'node:path'
import fs from 'node:fs'
import { copyDir, ensureDir, writeFile, dirExists, getTemplateDir } from '../utils/files.js'
import { promptFramework, promptLanguage, promptModules, promptTailwindCSS } from '../utils/prompts.js'
import { generateManifest } from '../utils/manifest.js'

type Framework = 'vue' | 'react'
type Language = 'ts' | 'js'

const PLUGINS: Record<Framework, { import: string; package: string }> = {
  vue: { import: 'vue', package: '@vitejs/plugin-vue' },
  react: { import: 'react', package: '@vitejs/plugin-react' },
}

function generateStore(language: Language): string {
  if (language === 'ts') {
    return `import { localExtStorage } from '@webext-core/storage'

interface Schema {
  count: number
}

// Example usage:
// const count = await localExtStorage.getItem('count')
// await localExtStorage.setItem('count', 0)
// localExtStorage.onChange('count', (newValue, oldValue) => {
//   console.log('Count changed from', oldValue, 'to', newValue)
// })

export {}
`
  }
  return `import { localExtStorage } from '@webext-core/storage'

// Example usage:
// const count = await localExtStorage.getItem('count')
// await localExtStorage.setItem('count', 0)
// localExtStorage.onChange('count', (newValue, oldValue) => {
//   console.log('Count changed from', oldValue, 'to', newValue)
// })

export {}
`
}

function generatePolyfill(): string {
  return `import browser from 'webextension-polyfill'

globalThis.browser = browser as any

export {}
`
}


function injectPolyfillImport(filePath: string, isModule: string): void {
  if (!fs.existsSync(filePath)) return

  let content = fs.readFileSync(filePath, 'utf-8')
  const polyfillImport = `import '../polyfill'\n`

  // Skip if already imported
  if (content.includes("import '../polyfill'")) return

  if (isModule === 'background' || isModule === 'content') {
    // Replace webextension-polyfill import with polyfill import
    if (content.includes("import browser from 'webextension-polyfill'")) {
      content = content.replace("import browser from 'webextension-polyfill'\n", polyfillImport)
    } else {
      // Add import at the top
      content = polyfillImport + content
    }
  } else {
    // For UI modules (popup, options, sidepanel, newtab), add import at top
    content = polyfillImport + content
  }

  fs.writeFileSync(filePath, content)
}

function generateViteConfig(
  framework: Framework,
  projectName: string,
  useTailwindcss: boolean
): string {
  const plugin = PLUGINS[framework]
  const tailwindImport = useTailwindcss ? `\nimport tailwindcss from '@tailwindcss/vite'` : ''
  const tailwindPlugin = useTailwindcss ? '\n      tailwindcss(),' : ''

  return `import { defineConfig, loadEnv } from 'vite'
import ${plugin.import} from '${plugin.package}'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'${tailwindImport}
import baseManifest from './manifest.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const manifest = { ...baseManifest }

  if (mode === 'firefox') {
    ;(manifest as Record<string, any>).browser_specific_settings = {
      gecko: {
        id: env.VITE_FIREFOX_ID || '${projectName}@example.com',
      },
    }

    // Convert Chrome side_panel to Firefox sidebar_action
    if ((manifest as Record<string, any>).side_panel) {
      ;(manifest as Record<string, any>).sidebar_action = {
        default_panel: (manifest as Record<string, any>).side_panel.default_path,
      }
      delete (manifest as Record<string, any>).side_panel
    }

    // Convert Chrome options_page to Firefox options_ui
    if ((manifest as Record<string, any>).options_page) {
      ;(manifest as Record<string, any>).options_ui = {
        page: (manifest as Record<string, any>).options_page,
        open_in_tab: true,
      }
      delete (manifest as Record<string, any>).options_page
    }
  }

  return {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    plugins: [
      ${plugin.import}(),${tailwindPlugin}
      crx({ manifest }),
    ],
    server: {
      port: 5173,
      hmr: {
        host: 'localhost',
        port: 5173,
      },
      cors: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
`
}

function generatePackageJson(projectName: string, framework: Framework, language: Language, useTailwindcss: boolean): string {
  const pkg: Record<string, unknown> = {
    name: projectName,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'vite',
      'dev:chrome': 'vite --mode chrome',
      'dev:firefox': 'vite --mode firefox',
      build: 'vite build',
      'build:chrome': 'vite build --mode chrome',
      'build:firefox': 'vite build --mode firefox',
      preview: 'vite preview',
    },
    dependencies: {
      'webextension-polyfill': '^0.12.0',
      '@webext-core/storage': '^1.2.0',
    },
    devDependencies: {
      vite: '^8.0.0',
      '@crxjs/vite-plugin': '^2.4.0',
    },
  }

  if (framework === 'vue') {
    ;(pkg.dependencies as Record<string, string>)['vue'] = '^3.5.0'
    ;(pkg.devDependencies as Record<string, string>)['@vitejs/plugin-vue'] = '^6.0.0'
    if (language === 'ts') {
      ;(pkg.devDependencies as Record<string, string>)['typescript'] = '^5.8.0'
      ;(pkg.devDependencies as Record<string, string>)['vue-tsc'] = '^2.2.0'
      ;(pkg.devDependencies as Record<string, string>)['@types/webextension-polyfill'] = '^0.12.0'
    }
  } else {
    ;(pkg.dependencies as Record<string, string>)['react'] = '^19.0.0'
    ;(pkg.dependencies as Record<string, string>)['react-dom'] = '^19.0.0'
    ;(pkg.devDependencies as Record<string, string>)['@vitejs/plugin-react'] = '^5.2.0'
    if (language === 'ts') {
      ;(pkg.devDependencies as Record<string, string>)['typescript'] = '^5.8.0'
      ;(pkg.devDependencies as Record<string, string>)['@types/react'] = '^19.0.0'
      ;(pkg.devDependencies as Record<string, string>)['@types/react-dom'] = '^19.0.0'
      ;(pkg.devDependencies as Record<string, string>)['@types/webextension-polyfill'] = '^0.12.0'
    }
  }

  ;(pkg.devDependencies as Record<string, string>)['@types/node'] = '^25.6.0'

  if (useTailwindcss) {
    ;(pkg.dependencies as Record<string, string>)['tailwindcss'] = '^4.0.0'
    ;(pkg.devDependencies as Record<string, string>)['@tailwindcss/vite'] = '^4.3.0'
  }

  return JSON.stringify(pkg, null, 2)
}

export async function create(projectName: string): Promise<void> {
  const projectDir = path.resolve(process.cwd(), projectName)

  if (dirExists(projectDir)) {
    console.error(`Error: Directory "${projectName}" already exists.`)
    process.exit(1)
  }

  console.log(`\nCreating browser extension: ${projectName}\n`)

  const framework = await promptFramework()
  const language = await promptLanguage()
  const modules = await promptModules()
  const useTailwindcss = await promptTailwindCSS()

  const templateKey = `${framework}-${language}`
  console.log(`\nScaffolding with ${templateKey}, modules: ${modules.join(', ')}\n`)

  // Create project directory
  ensureDir(projectDir)
  ensureDir(path.join(projectDir, 'src'))

  // Generate config files
  writeFile(path.join(projectDir, 'package.json'), generatePackageJson(projectName, framework, language, useTailwindcss))
  writeFile(path.join(projectDir, 'vite.config.ts'), generateViteConfig(framework, projectName, useTailwindcss))
  writeFile(path.join(projectDir, 'manifest.json'), generateManifest({ name: projectName, modules, language }))

  // Generate env files
  const envFiles: Record<string, string> = {
    '.env': '# Default environment variables\n',
    '.env.firefox': `# Firefox\nVITE_FIREFOX_ID=${projectName}@example.com\n`,
  }
  for (const [file, content] of Object.entries(envFiles)) {
    writeFile(path.join(projectDir, file), content)
  }

  // Generate .gitignore
  writeFile(path.join(projectDir, '.gitignore'), 'dist\nrelease\nnode_modules\n')

  // Generate tailwind CSS entry if enabled
  if (useTailwindcss) {
    writeFile(path.join(projectDir, 'src', 'style.css'), '/* @source "./"; */\n@import "tailwindcss";\n')
  }

  // Generate store index
  ensureDir(path.join(projectDir, 'src', 'store'))
  const ext = language === 'ts' ? '.ts' : '.js'
  writeFile(path.join(projectDir, 'src', 'store', `index${ext}`), generateStore(language))

  // Generate polyfill entry
  writeFile(path.join(projectDir, 'src', `polyfill${ext}`), generatePolyfill())

  // Copy tsconfig/jsconfig from template
  const templateDir = getTemplateDir()
  const templateSrc = path.join(templateDir, templateKey)

  const configFile = language === 'ts' ? 'tsconfig.json' : 'jsconfig.json'
  const configSrc = path.join(templateSrc, configFile)
  if (fs.existsSync(configSrc)) {
    fs.copyFileSync(configSrc, path.join(projectDir, configFile))
  }

  // Copy tsconfig.node.json if exists (Vue TS)
  const nodeConfigSrc = path.join(templateSrc, 'tsconfig.node.json')
  if (fs.existsSync(nodeConfigSrc)) {
    fs.copyFileSync(nodeConfigSrc, path.join(projectDir, 'tsconfig.node.json'))
  }

  // Copy env.d.ts if exists (Vue TS), otherwise generate for TS projects
  const envDtsSrc = path.join(templateSrc, 'src', 'env.d.ts')
  if (fs.existsSync(envDtsSrc)) {
    ensureDir(path.join(projectDir, 'src'))
    fs.copyFileSync(envDtsSrc, path.join(projectDir, 'src', 'env.d.ts'))
  } else if (language === 'ts') {
    ensureDir(path.join(projectDir, 'src'))
    writeFile(path.join(projectDir, 'src', 'env.d.ts'), '/// <reference types="vite/client" />\n')
  }

  // Copy selected module templates
  for (const mod of modules) {
    const modDir = path.join(templateSrc, 'src', mod)
    if (dirExists(modDir)) {
      copyDir(modDir, path.join(projectDir, 'src', mod))

      // Inject polyfill import to module entry files
      if (mod === 'background' || mod === 'content') {
        const entryFile = path.join(projectDir, 'src', mod, `index${ext}`)
        injectPolyfillImport(entryFile, mod)
      } else if (['popup', 'options', 'sidepanel', 'newtab'].includes(mod)) {
        const mainFile = path.join(projectDir, 'src', mod, `main${language === 'ts' ? '.tsx' : '.jsx'}`)
        injectPolyfillImport(mainFile, mod)
      }
    }
  }

  console.log(`Done! Project created at ./${projectName}\n`)
  console.log('Next steps:')
  console.log(`  cd ${projectName}`)
  console.log('  pnpm install')
  console.log('  pnpm dev            # development')
  console.log('  pnpm build          # build for production')
  console.log('  pnpm build:firefox  # build for Firefox')
  console.log('  pnpm pack           # build + zip')
  console.log('  pnpm pack:firefox   # build + zip for Firefox')
  console.log()
}

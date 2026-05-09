import path from 'node:path'
import fs from 'node:fs'
import { copyDir, ensureDir, writeFile, dirExists, getTemplateDir } from '../utils/files.js'
import { promptFramework, promptLanguage, promptModules } from '../utils/prompts.js'
import { generateManifest } from '../utils/manifest.js'

type Framework = 'vue' | 'react'
type Language = 'ts' | 'js'

const PLUGINS: Record<Framework, { import: string; package: string }> = {
  vue: { import: 'vue', package: '@vitejs/plugin-vue' },
  react: { import: 'react', package: '@vitejs/plugin-react' },
}

function getExt(framework: Framework, language: Language): string {
  return `.${language}`
}

function generateViteConfig(
  framework: Framework,
  language: Language,
  modules: string[]
): string {
  const plugin = PLUGINS[framework]
  const ext = getExt(framework, language)

  const inputLines: string[] = []
  for (const mod of modules) {
    if (['popup', 'options', 'sidepanel', 'devtools'].includes(mod)) {
      inputLines.push(`    ${mod}: resolve(__dirname, 'src/${mod}/index.html')`)
    } else {
      inputLines.push(`    ${mod}: resolve(__dirname, 'src/${mod}/index${ext}')`)
    }
  }

  return `import { defineConfig } from 'vite'
import ${plugin.import} from '${plugin.package}'
import { resolve } from 'path'
import fs from 'fs'

const isDev = process.env.NODE_ENV === 'development'
const outBase = isDev ? 'dist/dev/chrome' : 'dist/build/chrome'
const pageModules = ['popup', 'options', 'sidepanel', 'devtools']

export default defineConfig({
  plugins: [
    ${plugin.import}(),
    {
      name: 'copy-assets',
      writeBundle() {
        const outDir = resolve(__dirname, outBase)
        if (fs.existsSync('manifest.json')) {
          fs.copyFileSync('manifest.json', resolve(outDir, 'manifest.json'))
        }
        if (fs.existsSync('public')) {
          copyDir('public', outDir)
        }
        let hasSrcDir = false
        for (const mod of pageModules) {
          const srcHtml = resolve(outDir, 'src', mod, 'index.html')
          const destHtml = resolve(outDir, mod, 'index.html')
          if (fs.existsSync(srcHtml)) {
            hasSrcDir = true
            if (!fs.existsSync(resolve(outDir, mod))) {
              fs.mkdirSync(resolve(outDir, mod), { recursive: true })
            }
            fs.copyFileSync(srcHtml, destHtml)
          }
        }
        if (hasSrcDir) {
          fs.rmSync(resolve(outDir, 'src'), { recursive: true, force: true })
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
${inputLines.join(',\n')}
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (['background', 'content'].includes(chunkInfo.name)) {
            return '[name]/index.js'
          }
          return 'assets/js/[name].js'
        },
        chunkFileNames: 'assets/js/chunks/[name].js',
        assetFileNames: (assetInfo) => {
          const ext = (assetInfo.name || '').split('.').pop()
          if (ext === 'css') return 'assets/css/[name].[ext]'
          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
            return 'assets/images/[name].[ext]'
          }
          return 'assets/[name].[ext]'
        },
      },
    },
    outDir: outBase,
    emptyOutDir: true,
  },
})

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = resolve(src, entry.name)
    const destPath = resolve(dest, entry.name)
    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath)
  }
}
`
}

function generatePackageJson(projectName: string, framework: Framework, language: Language): string {
  const pkg: Record<string, unknown> = {
    name: projectName,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'NODE_ENV=development vite build --watch',
      build: 'NODE_ENV=production vite build',
      preview: 'vite preview',
    },
    dependencies: {
      'webextension-polyfill': '^0.12.0',
    },
    devDependencies: {
      vite: '^6.3.0',
    },
  }

  if (framework === 'vue') {
    ;(pkg.dependencies as Record<string, string>)['vue'] = '^3.5.0'
    ;(pkg.devDependencies as Record<string, string>)['@vitejs/plugin-vue'] = '^5.2.0'
    if (language === 'ts') {
      ;(pkg.scripts as Record<string, string>).build = 'vue-tsc --noEmit && vite build'
      ;(pkg.devDependencies as Record<string, string>)['typescript'] = '^5.8.0'
      ;(pkg.devDependencies as Record<string, string>)['vue-tsc'] = '^2.2.0'
      ;(pkg.devDependencies as Record<string, string>)['@types/webextension-polyfill'] = '^0.12.0'
    }
  } else {
    ;(pkg.dependencies as Record<string, string>)['react'] = '^19.0.0'
    ;(pkg.dependencies as Record<string, string>)['react-dom'] = '^19.0.0'
    ;(pkg.devDependencies as Record<string, string>)['@vitejs/plugin-react'] = '^4.4.0'
    if (language === 'ts') {
      ;(pkg.scripts as Record<string, string>).build = 'tsc --noEmit && vite build'
      ;(pkg.devDependencies as Record<string, string>)['typescript'] = '^5.8.0'
      ;(pkg.devDependencies as Record<string, string>)['@types/react'] = '^19.0.0'
      ;(pkg.devDependencies as Record<string, string>)['@types/react-dom'] = '^19.0.0'
      ;(pkg.devDependencies as Record<string, string>)['@types/webextension-polyfill'] = '^0.12.0'
    }
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

  const templateKey = `${framework}-${language}`
  console.log(`\nScaffolding with ${templateKey}, modules: ${modules.join(', ')}\n`)

  // Create project directory
  ensureDir(projectDir)
  ensureDir(path.join(projectDir, 'src'))

  // Generate config files
  writeFile(path.join(projectDir, 'package.json'), generatePackageJson(projectName, framework, language))
  writeFile(path.join(projectDir, 'vite.config.ts'), generateViteConfig(framework, language, modules))
  writeFile(path.join(projectDir, 'manifest.json'), generateManifest({ name: projectName, modules, language }))

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

  // Copy env.d.ts if exists (Vue TS)
  const envDtsSrc = path.join(templateSrc, 'src', 'env.d.ts')
  if (fs.existsSync(envDtsSrc)) {
    ensureDir(path.join(projectDir, 'src'))
    fs.copyFileSync(envDtsSrc, path.join(projectDir, 'src', 'env.d.ts'))
  }

  // Copy selected module templates
  for (const mod of modules) {
    const modDir = path.join(templateSrc, 'src', mod)
    if (dirExists(modDir)) {
      copyDir(modDir, path.join(projectDir, 'src', mod))
    }
  }

  console.log(`Done! Project created at ./${projectName}\n`)
  console.log('Next steps:')
  console.log(`  cd ${projectName}`)
  console.log('  pnpm install')
  console.log('  pnpm dev')
  console.log()
}

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

function generateViteConfig(
  framework: Framework,
  projectName: string
): string {
  const plugin = PLUGINS[framework]

  return `import { defineConfig, loadEnv } from 'vite'
import ${plugin.import} from '${plugin.package}'
import { crx } from '@crxjs/vite-plugin'
import zipPack from 'vite-plugin-zip-pack'
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
  }

  const platform = mode === 'production' ? '' : mode
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const extName = String(baseManifest.name).replace(/[^a-zA-Z0-9_-]/g, '_')
  const zipFileName = platform ? extName + '_' + platform + '_' + baseManifest.version + '_' + date + '.zip' : extName + '_' + baseManifest.version + '_' + date + '.zip'

  return {
    plugins: [
      ${plugin.import}(),
      crx({ manifest }),
      {
        name: 'inject-browser-polyfill',
        enforce: 'pre',
        transform(code, id) {
          if (/\\.(ts|js|tsx|jsx)$/.test(id) && !id.includes('node_modules')) {
            return "import browser from 'webextension-polyfill';\\n" + code
          }
          return code
        },
      },
      zipPack({
        inDir: 'dist',
        outDir: 'release',
        outFileName: zipFileName,
      }),
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

function generatePackageJson(projectName: string, framework: Framework, language: Language): string {
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
    },
    devDependencies: {
      vite: '^8.0.0',
      '@crxjs/vite-plugin': '^2.4.0',
      'vite-plugin-zip-pack': '^1.2.4',
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
  writeFile(path.join(projectDir, 'vite.config.ts'), generateViteConfig(framework, projectName))
  writeFile(path.join(projectDir, 'manifest.json'), generateManifest({ name: projectName, modules, language }))

  // Generate env files
  const envFiles: Record<string, string> = {
    '.env': '# Default environment variables\n',
    '.env.firefox': `# Firefox\nVITE_FIREFOX_ID=${projectName}@example.com\n`,
  }
  for (const [file, content] of Object.entries(envFiles)) {
    writeFile(path.join(projectDir, file), content)
  }

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
    }
  }

  console.log(`Done! Project created at ./${projectName}\n`)
  console.log('Next steps:')
  console.log(`  cd ${projectName}`)
  console.log('  pnpm install')
  console.log('  pnpm dev')
  console.log()
}

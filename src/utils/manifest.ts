export interface ManifestOptions {
  name: string
  modules: string[]
  language: 'ts' | 'js'
}

interface ManifestV3 {
  manifest_version: 3
  name: string
  version: string
  description: string
  action?: { default_popup?: string }
  background?: { service_worker: string; type: 'module' }
  content_scripts?: Array<{ matches: string[]; js: string[] }>
  options_page?: string
  side_panel?: { default_path: string }
  devtools_page?: string
  chrome_url_overrides?: Record<string, string>
  permissions?: string[]
}

export function generateManifest(options: ManifestOptions): string {
  const { name, modules, language } = options
  const ext = language === 'ts' ? '.ts' : '.js'

  const manifest: Record<string, unknown> = {
    manifest_version: 3,
    name,
    version: '0.0.1',
    description: `${name} browser extension`,
  }

  const permissions: string[] = ['storage']

  if (modules.includes('popup')) {
    manifest.action = { default_popup: 'src/popup/index.html' }
  }

  if (modules.includes('newtab')) {
    manifest.chrome_url_overrides = { newtab: 'src/newtab/index.html' }
  }

  if (modules.includes('background')) {
    manifest.background = {
      service_worker: `src/background/index${ext}`,
      type: 'module',
    }
  }

  if (modules.includes('content')) {
    manifest.content_scripts = [
      {
        matches: ['<all_urls>'],
        js: [`src/content/index${ext}`],
      },
    ]
  }

  if (modules.includes('options')) {
    manifest.options_page = 'src/options/index.html'
  }

  if (modules.includes('sidepanel')) {
    manifest.side_panel = { default_path: 'src/sidepanel/index.html' }
    permissions.push('sidePanel')
  }

  if (modules.includes('devtools')) {
    manifest.devtools_page = 'src/devtools/index.html'
  }

  if (permissions.length > 0) {
    manifest.permissions = permissions
  }

  manifest.content_security_policy = {
    extension_pages: "script-src 'self'; object-src 'self'; connect-src 'self' ws://localhost:* http://localhost:* ws://127.0.0.1:* http://127.0.0.1:*",
  }

  return JSON.stringify(manifest, null, 2)
}

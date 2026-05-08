import fs from 'node:fs'
import path from 'node:path'

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function copyDir(src: string, dest: string): void {
  ensureDir(dest)
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
}

export function dirExists(dir: string): boolean {
  return fs.existsSync(dir)
}

export function getTemplateDir(): string {
  return path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '..', 'templates')
}

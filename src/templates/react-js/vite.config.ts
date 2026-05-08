import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const entries = {
  popup: resolve(__dirname, 'src/popup/index.html'),
  options: resolve(__dirname, 'src/options/index.html'),
  sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
  devtools: resolve(__dirname, 'src/devtools/index.html'),
  background: resolve(__dirname, 'src/background/index.js'),
  content: resolve(__dirname, 'src/content/index.js'),
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: entries,
      output: {
        entryFileNames: '[name]/index.js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name]/[name].[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})

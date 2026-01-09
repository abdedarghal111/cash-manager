import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from "@tailwindcss/vite"
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { resolveAliases } from './shared/resolveAliases.mjs'
import { replacementConstants } from './shared/replacementDefineConstants.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const __root = resolve(__dirname, '..')
const __src = resolve(__root, 'src')
const __out = resolve(__root, 'dist', 'frontend')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), 
    svelte({compilerOptions: {
      dev: true,
      css: 'external'
    }}),
  ],
  resolve: {
    'alias': resolveAliases(__src)
  },
  define: replacementConstants,
  server: {
    open: false,
    watch: {
      additionalPaths: (watcher) => {
        watcher.add(__src)
      }
    }
  },
  cacheDir: '/.vite-cache',
  root: __src,
  build: {
    target: 'modules',
    outDir: __out,
    assetsDir: 'public',
    copyPublicDir: false,
    minify: false,
    cssMinify: false,
    emptyOutDir: false,
    reportCompressedSize: false,
    write: true
  }
})

import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from "@tailwindcss/vite"
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { resolveAliases } from '../shared/resolveAliases.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const __root = resolve(__dirname, '..', '..')
const __out = resolve(__root, 'dist', 'electron')
const __src = resolve(__root, 'src')
const __index = resolve(__src, 'index.html')
const __electronConfigFolder = resolve(__root, 'buildFiles', 'electron')
const __electronMain = resolve(__electronConfigFolder, 'electronMain.mjs')
const __electronPreload = resolve(__electronConfigFolder, 'electronPreload.mjs')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: __electronMain
      },
      outDir: resolve(__out, 'main')
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: __electronPreload
      },
      outDir: resolve(__out, 'preload')
    }
  },
  renderer: {
    plugins: [svelte(), tailwindcss()],
    root: __src,
    build: {
      outDir: resolve(__out, 'renderer'),
      rollupOptions: {
        input: {
          index: __index
        }
      }
    },
    resolve: {
    'alias': resolveAliases(__src)
  },
  }
})
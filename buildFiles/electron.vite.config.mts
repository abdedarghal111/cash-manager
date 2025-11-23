import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const __electronMain = resolve(__dirname, 'electronMain.mjs')
const __electronPreload = resolve(__dirname, 'electronPreload.mjs')
const __root = resolve(__dirname, '..')
const __out = resolve(__root, 'dist', 'electron')
const __src = resolve(__root, 'src')
const __index = resolve(__src, 'index.html')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: __electronMain
      },
      outDir: join(__out, 'main')
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: __electronPreload
      },
      outDir: join(__out, 'preload')
    }
  },
  renderer: {
    plugins: [svelte()],
    root: __src,
    build: {
      outDir: join(__out, 'renderer'),
      rollupOptions: {
        input: __index
      }
    },
    resolve: {
    'alias': {
      "@src": resolve(__src),
      "@components": resolve(__src, 'components'),
      "@single": resolve(__src, 'single'),
      "@class": resolve(__src, 'class'),
      "@assets": resolve(__src, 'assets'),
      "@routes": resolve(__src, 'routes'),
    }
  },
  }
})
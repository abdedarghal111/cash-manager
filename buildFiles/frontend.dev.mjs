import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const __root = resolve(__dirname, '..')
const __src = resolve(__root, 'src')
const __out = resolve(__root, 'dist', 'frontend', 'src')
// const __outPublic = resolve(__out, 'public')

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
    'alias': {
      "@src": resolve(__src),
      "@components": resolve(__src, 'components'),
      "@single": resolve(__src, 'single'),
      "@class": resolve(__src, 'class'),
      "@assets": resolve(__src, 'assets'),
      "@routes": resolve(__src, 'routes'),
    }
  },
  server: {
    open: false,
    watch: {
      additionalPaths: (watcher) => {
        watcher.add(__src);
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

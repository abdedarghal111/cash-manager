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
    svelte()
  ],
  // resolve: {
  //   'alias': {
  //     "@src": resolve(__root, 'src', 'svelte')
  //   }
  // },
  root: __src,
  build: {
    target: 'modules',
    outDir: __out,
    assetsDir: 'public',
    cssMinify: true,
    minify: true,
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 0
  }
})

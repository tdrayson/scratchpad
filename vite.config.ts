import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
  build: {
    rollupOptions: {
      input: { main: resolve(import.meta.dirname, 'index.html'), settings: resolve(import.meta.dirname, 'settings.html') },
    },
  },
  test: {
    environment: 'happy-dom',
  },
})

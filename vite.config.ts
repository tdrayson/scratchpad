import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), settings: resolve(__dirname, 'settings.html') },
    },
  },
  test: {
    environment: 'happy-dom',
  },
})

import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@formulaflash/core': path.resolve(__dirname, '../../packages/core/index.ts'),
    },
  },
})

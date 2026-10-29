import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['backend/**/*.test.{ts,tsx}', 'frontend/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@frontend': path.resolve(__dirname, './frontend'),
      '@backend': path.resolve(__dirname, './backend'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
})

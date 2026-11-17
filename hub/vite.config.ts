import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
  preview: { port: 5180 },
  esbuild: {
    legalComments: 'none',
  },
  build: {
    target: 'es2022',
    cssMinify: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['framer-motion'],
          dompurify: ['dompurify'],
        },
      },
    },
  },
  test: { environment: 'jsdom' },
})

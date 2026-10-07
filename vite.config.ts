import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // M29: VITE_PROXY chỉ có ở `.env.firebase` ⇒ bản Vercel vẫn base `/` + outDir `dist/` (design.m29.md §4)
  const proxy = loadEnv(mode, process.cwd(), 'VITE_')['VITE_PROXY'] ?? ''
  return {
    base: proxy ? `${proxy}/` : '/',
    build: { outDir: proxy ? 'functions/web' : 'dist' },
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }
})

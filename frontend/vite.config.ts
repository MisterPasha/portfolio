import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    // Vercel routes /api to Django itself. This proxy is only for standalone Vite.
    proxy: process.env.VERCEL ? undefined : {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})

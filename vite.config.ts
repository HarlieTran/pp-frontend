import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'window',
  },
  server: {
    proxy: {
      // AWS Bedrock + Pexels (claude-proxy.mjs)
      '/api/scan': { target: 'http://localhost:8787', changeOrigin: true },
      '/api/recipes/aws': { target: 'http://localhost:8787', changeOrigin: true },

      // User data + Spoonacular proxy (user-data.mjs)
      '/api/auth': { target: 'http://localhost:8788', changeOrigin: true },
      '/api/onboarding': { target: 'http://localhost:8788', changeOrigin: true },
      '/api/pantry': { target: 'http://localhost:8788', changeOrigin: true },
      '/api/recipes/spoonacular': { target: 'http://localhost:8788', changeOrigin: true },
      '/api/spoonacular': { target: 'http://localhost:8788', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

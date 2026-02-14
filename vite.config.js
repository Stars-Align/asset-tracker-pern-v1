import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // 🟢 强制将所有 react 引用重定向到根目录的 node_modules
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  server: {
    proxy: {
      '/api': { // Assuming a common proxy path like /api
        target: 'http://localhost:5002',
        changeOrigin: true,

      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
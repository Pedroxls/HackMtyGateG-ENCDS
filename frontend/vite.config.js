import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/products': 'http://localhost:8000',
      '/employees': 'http://localhost:8000',
      '/flights': 'http://localhost:8000',
    }
  }
})

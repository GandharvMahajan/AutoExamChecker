import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  define: {
    // Fix for Node.js v16 compatibility
    __dirname: JSON.stringify(''),
    'process.env': {}
  }
})

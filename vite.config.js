import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use '/' for local development, '/Poker-Game/' for GitHub Pages deployment
  base: process.env.NODE_ENV === 'production' ? '/Poker-Game/' : '/',
  server: {
    host: true, // Listen on all network interfaces
    port: 5173
  }
})
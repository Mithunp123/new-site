import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    // Explicitly include all deps that have peer-dep resolution issues
    include: [
      'react',
      'react-dom',
      'react-is',
      'recharts',
      'lottie-react',
      'framer-motion',
      'zustand',
    ],
    // Force re-bundle on every cold start — prevents stale cache white pages
    force: false,
  },
  server: {
    // Clear module graph on restart
    warmup: {
      clientFiles: ['./src/main.jsx', './src/App.jsx'],
    },
  },
})

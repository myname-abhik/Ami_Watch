import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// In dev the player runs on :5173 and talks to the backend through this proxy,
// so the same relative URLs (/api, /hls) work in dev and in production.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backend = env.BACKEND_URL || 'http://localhost:3000'
  return {
    plugins: [react()],
    server: { proxy: { '/api': backend, '/hls': backend } },
  }
})

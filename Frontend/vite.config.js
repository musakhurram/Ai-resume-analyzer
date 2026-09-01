import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Keep Google Identity popup communication compatible with the dev server.
// The production equivalent is configured in Frontend/vercel.json.
const googlePopupHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

export default defineConfig({
  plugins: [react()],
  server: {
    headers: googlePopupHeaders,
  },
  preview: {
    headers: googlePopupHeaders,
  },
})

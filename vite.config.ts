// ABOUTME: Configures Vite build and dev behavior for this prototype app.
// ABOUTME: Registers React and Tailwind plugins and sets the deploy base path.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.NODE_ENV === 'production' ? '/qalert-merged-ui/' : '/',
})

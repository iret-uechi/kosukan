import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { csvApiPlugin } from './server/csv-api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), csvApiPlugin()],
})

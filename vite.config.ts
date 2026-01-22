import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Pastikan baris ini sesuai dengan yang kamu instal
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
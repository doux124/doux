import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project site: must match the repo name exactly, or every asset
  // 404s and the page renders blank. Repo is `Jordan` under jordanlowjunyi.
  base: '/Jordan/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' uses relative asset paths, so it works under any GitHub Pages repo name
export default defineConfig({
  plugins: [react()],
  base: './',
})

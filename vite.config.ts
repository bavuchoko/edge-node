import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `vite build --mode lib` builds the publishable package from src/graph.
  if (mode === 'lib') {
    return {
      plugins: [react()],
      publicDir: false,
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        copyPublicDir: false,
        minify: false,
        lib: {
          entry: fileURLToPath(new URL('./src/graph/index.ts', import.meta.url)),
          formats: ['es'],
          fileName: 'index',
        },
        rolldownOptions: {
          external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/],
        },
      },
    }
  }

  // Demo app (dev server / static build).
  return {
    plugins: [react()],
    build: {
      outDir: 'dist-demo',
    },
  }
})

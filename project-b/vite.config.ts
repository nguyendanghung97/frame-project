import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const frameCommonSrc = path.resolve(rootDir, '../frame-common/src')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  build: {
    cssMinify: false,
  },
  server: {
    fs: {
      // Allow importing frame-common source outside project/
      allow: [rootDir, path.resolve(rootDir, '..')],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      // Dev like ncs-common: resolve package to source (no rebuild dist for HMR)
      'frame-common': frameCommonSrc,
      '@common': frameCommonSrc,
      react: path.resolve(rootDir, 'node_modules/react'),
      'react-dom': path.resolve(rootDir, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    exclude: ['frame-common'],
  },
})

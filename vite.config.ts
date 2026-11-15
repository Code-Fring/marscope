import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'leaflet-vendor': ['leaflet', 'proj4', 'proj4leaflet'],
          'preact-vendor': ['preact', '@preact/signals'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
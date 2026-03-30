import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5175,
    proxy: {
      '/api': 'http://localhost:3003',
      '/ws': {
        target: 'ws://localhost:3003',
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
});

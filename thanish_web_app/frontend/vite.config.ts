import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build straight into Django's static dir with stable file names so templates/index.html can reference them.
export default defineConfig({
  plugins: [react()],
  base: '/static/app/',
  build: {
    outDir: '../static/app',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.tsx',
      output: { entryFileNames: 'app.js', chunkFileNames: 'chunk-[name].js', assetFileNames: 'app[extname]' },
    },
  },
  server: { proxy: { '/api': 'http://127.0.0.1:8000', '/health': 'http://127.0.0.1:8000' } },
});

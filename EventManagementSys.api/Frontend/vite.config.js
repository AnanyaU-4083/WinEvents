import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(projectRoot, 'src') },
  },
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/auth/**'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5244',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    alias: {
      '@': resolve(__dirname, './src'),
    },
    include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['node_modules/**', 'tests/unit/security/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportOnFailure: true,
    },
  },
  esbuild: {
    jsxImportSource: 'react',
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  base: '/openaccounts/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/openaccounts/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
  },
});

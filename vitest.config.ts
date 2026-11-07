import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@formulaflash/core': path.resolve(__dirname, './packages/core/index.ts'),
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/*.spec.ts'],
  },
});

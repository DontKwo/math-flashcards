import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/matrix',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    {
      name: 'Matrix Desktop',
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'Matrix Mobile',
      use: {
        viewport: { width: 360, height: 740 },
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: 'pnpm --filter app run dev --port 5173 --host',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});

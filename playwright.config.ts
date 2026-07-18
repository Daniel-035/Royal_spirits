import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node dist/index.js',
      url: 'http://localhost:4000/api/v1/health',
      cwd: 'apps/api',
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'pnpm --filter @royal-spirits/customer dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});

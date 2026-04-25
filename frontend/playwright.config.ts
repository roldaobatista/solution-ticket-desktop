import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config para Solution Ticket — testes E2E do frontend.
 *
 * Antes do primeiro uso: `npx playwright install chromium` (~150 MB).
 * Em CI use: `npx playwright install --with-deps chromium`.
 *
 * Os specs em `e2e/` rodam contra o Next.js em http://127.0.0.1:3000.
 * O backend deve estar disponivel em http://127.0.0.1:3001 (subir via
 * `pnpm --filter ./electron dev` ou `pnpm dev:backend` + `pnpm dev:frontend`).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2, // paralelo em CI (2 local)
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: 'pnpm start',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});

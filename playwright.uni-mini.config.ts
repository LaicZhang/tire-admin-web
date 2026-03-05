import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const UNI_MINI_PORT = Number.parseInt(process.env.UNI_MINI_E2E_PORT || '9010', 10)
const MOCK_PORT = Number.parseInt(process.env.UNI_MINI_MOCK_PORT || '9100', 10)

export default defineConfig({
  testDir: './e2e/uni-mini',
  reporter: [['html', { outputFolder: 'playwright-report-uni-mini' }], ['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  use: {
    baseURL: `http://127.0.0.1:${UNI_MINI_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: 'test-results/.auth/uni-mini.json',
  },
  globalSetup: './e2e/uni-mini/global-setup.ts',
  webServer: [
    {
      command: `node ${path.join('..', 'uni-mini', 'e2e', 'mock', 'server.mjs')}`,
      url: `http://127.0.0.1:${MOCK_PORT}/__health`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'pnpm -C ../uni-mini dev:h5:e2e',
      url: `http://127.0.0.1:${UNI_MINI_PORT}`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})


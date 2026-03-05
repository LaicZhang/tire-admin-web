import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = Number.parseInt(process.env.E2E_WEB_PORT || "18848", 10);
const BASE_URL = `http://localhost:${WEB_PORT}`;
const storageStatePath = "test-results/.auth/state.json";

export default defineConfig({
  testDir: "./e2e/mock",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry"
  },
  projects: [
    {
      name: "setup",
      testMatch: "**/*.setup.ts"
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testMatch: "**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        storageState: storageStatePath
      }
    }
  ],
  webServer: {
    command: "node e2e/mock/webserver.mjs",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});

import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试文件目录
  testDir: "./e2e",

  // 测试文件匹配模式
  testMatch: "**/*.spec.ts",

  // 是否完全并行运行测试
  fullyParallel: true,

  // 禁止 test.only 提交到 CI
  forbidOnly: !!process.env.CI,

  // CI 环境失败重试次数
  retries: process.env.CI ? 2 : 0,

  // CI 环境并行 worker 数量
  workers: process.env.CI ? 1 : undefined,

  // 测试报告器
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // 全局测试配置
  use: {
    // 基础 URL
    baseURL: "http://localhost:8848",

    // 失败时收集 trace
    trace: "on-first-retry",

    // 失败时截图
    screenshot: "only-on-failure",

    // 录制视频
    video: "on-first-retry"
  },

  // 测试项目配置 (浏览器)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    }
  ],

  // 启动开发服务器
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:8848",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000 // 2 分钟超时
  }
});

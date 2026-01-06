import { test, expect } from "@playwright/test";

/**
 * 基础示例测试 - 验证 Playwright 配置正确
 */
test.describe("基础功能验证", () => {
  test("应用应能正常启动", async ({ page }) => {
    await page.goto("/");

    // 验证页面加载成功
    await expect(page).toHaveURL(/\/(login|welcome|dashboard)/);
  });

  test("页面应包含正确的 meta 标签", async ({ page }) => {
    await page.goto("/");

    // 检查 viewport meta 标签
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute("content", /width=device-width/);
  });
});

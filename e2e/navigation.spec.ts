import { test, expect } from "@playwright/test";

/**
 * 导航功能 E2E 测试
 */
test.describe("导航功能", () => {
  test.beforeEach(async ({ page }) => {
    // 跳过登录，直接测试公开页面
    await page.goto("/");
  });

  test("应能正确导航到登录页", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未登录用户访问受保护页面应重定向到登录页", async ({ page }) => {
    // 尝试访问需要登录的页面
    await page.goto("/welcome");

    // 应该被重定向到登录页
    await expect(page).toHaveURL(/\/login/);
  });

  test("页面应能正确处理 404 路由", async ({ page }) => {
    await page.goto("/non-existent-page-12345");

    // 应该显示 404 页面或重定向
    const url = page.url();
    const is404OrRedirected =
      url.includes("404") || url.includes("login") || url.includes("error");
    expect(is404OrRedirected).toBe(true);
  });
});

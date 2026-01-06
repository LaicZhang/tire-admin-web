import { test as base, expect } from "@playwright/test";

/**
 * 自定义测试 fixtures
 * 扩展 Playwright 的 test 对象，添加项目特定的测试工具
 */

// 已登录用户的 fixture
export const test = base.extend<{
  authenticatedPage: ReturnType<typeof base.extend>;
}>({
  // 可以在这里添加自定义 fixtures
  // 例如：已登录状态、测试数据等
});

export { expect };

/**
 * 登录辅助函数
 */
export async function login(
  page: Parameters<Parameters<typeof test>[1]>[0]["page"],
  username = "admin",
  password = "admin123"
) {
  await page.goto("/login");
  await page.getByPlaceholder("账号").fill(username);
  await page.getByPlaceholder("密码").fill(password);
  await page.getByRole("button", { name: /登录/i }).click();
  await page.waitForURL(/\/(welcome|dashboard|home)/);
}

/**
 * 等待页面加载完成
 */
export async function waitForPageLoad(
  page: Parameters<Parameters<typeof test>[1]>[0]["page"]
) {
  await page.waitForLoadState("networkidle");
}

/**
 * 常用选择器
 */
export const selectors = {
  sidebar: ".sidebar",
  header: ".navbar",
  mainContent: ".main-content",
  loginButton: 'button:has-text("登录")',
  logoutButton: 'button:has-text("退出")'
};

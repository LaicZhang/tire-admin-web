import { test, expect } from "@playwright/test";

/**
 * 登录页面 E2E 测试
 */
test.describe("登录功能", () => {
  test.beforeEach(async ({ page }) => {
    // 导航到登录页面
    await page.goto("/login");
  });

  test("登录页面应正确显示", async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/轮胎管理系统/);

    // 验证登录表单存在
    await expect(page.getByPlaceholder("账号")).toBeVisible();
    await expect(page.getByPlaceholder("密码")).toBeVisible();
  });

  test("空表单提交应显示验证错误", async ({ page }) => {
    // 点击登录按钮
    await page.getByRole("button", { name: /登录/i }).click();

    // 等待验证消息出现
    await expect(page.locator(".el-form-item__error")).toBeVisible();
  });

  test("正确的凭据应成功登录", async ({ page }) => {
    // 填写登录表单
    await page.getByPlaceholder("账号").fill("admin");
    await page.getByPlaceholder("密码").fill("admin123");

    // 点击登录按钮
    await page.getByRole("button", { name: /登录/i }).click();

    // 等待重定向到首页
    await page.waitForURL(/\/(welcome|dashboard|home)/);

    // 验证登录成功
    await expect(page.locator(".sidebar")).toBeVisible();
  });

  test("错误的凭据应显示错误消息", async ({ page }) => {
    // 填写错误的登录信息
    await page.getByPlaceholder("账号").fill("wronguser");
    await page.getByPlaceholder("密码").fill("wrongpassword");

    // 点击登录按钮
    await page.getByRole("button", { name: /登录/i }).click();

    // 等待错误提示出现
    await expect(page.locator(".el-message--error")).toBeVisible({
      timeout: 10000
    });
  });
});

import { test, expect } from "@playwright/test";

const LOGIN_FLOW_TIMEOUT_MS = 30_000;
const STORAGE_ASSERT_TIMEOUT_MS = 10_000;

test.describe("登录（mock）", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("登录成功应写入登录态", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByPlaceholder("用户名/手机号/账号").fill("admin");
    await page.getByPlaceholder("密码").fill("admin123");
    await page.getByPlaceholder("验证码").fill("1111");
    await page.getByRole("button", { name: "登录", exact: true }).click();

    const companyDialog = page.getByRole("dialog", { name: "请选择公司" });
    const appWrapper = page.locator(".app-wrapper");

    const firstVisible = await Promise.any([
      companyDialog
        .waitFor({ state: "visible", timeout: LOGIN_FLOW_TIMEOUT_MS })
        .then(() => "company" as const),
      appWrapper
        .waitFor({ state: "visible", timeout: LOGIN_FLOW_TIMEOUT_MS })
        .then(() => "app" as const)
    ]);

    if (firstVisible === "company") {
      await companyDialog
        .getByRole("button", { name: "确定", exact: true })
        .click();
      await expect(companyDialog).toBeHidden({
        timeout: LOGIN_FLOW_TIMEOUT_MS
      });
    }

    await expect(appWrapper).toBeVisible({ timeout: LOGIN_FLOW_TIMEOUT_MS });

    await expect
      .poll(() => page.evaluate(() => document.cookie), {
        timeout: STORAGE_ASSERT_TIMEOUT_MS
      })
      .toContain("multiple-tabs=");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("user-info")), {
        timeout: STORAGE_ASSERT_TIMEOUT_MS
      })
      .not.toBeNull();
  });

  test("表单校验：验证码不足 4 位应提示错误且不跳转", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByPlaceholder("用户名/手机号/账号").fill("admin");
    await page.getByPlaceholder("密码").fill("admin123");
    await page.getByPlaceholder("验证码").fill("1");
    await page.getByRole("button", { name: "登录", exact: true }).click();

    const captchaItem = page
      .locator(".el-form-item")
      .filter({ hasText: "验证码" })
      .first();
    await expect(captchaItem.locator(".el-form-item__error")).toContainText(
      "请输入完整的验证码"
    );
    await expect(page).toHaveURL(/#\/login$/);
  });
});

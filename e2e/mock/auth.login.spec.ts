import { test, expect } from "@playwright/test";

test.describe("登录（mock）", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("登录成功应写入登录态", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByPlaceholder("用户名/手机号/账号").fill("admin");
    await page.getByPlaceholder("密码").fill("admin123");
    await page.getByPlaceholder("验证码").fill("1111");
    await page.getByRole("button", { name: "登录", exact: true }).click();

    await expect(page.locator(".el-message--success")).toContainText(
      "登录成功",
      {
        timeout: 30_000
      }
    );

    await expect
      .poll(() => page.evaluate(() => document.cookie), { timeout: 10_000 })
      .toContain("multiple-tabs=");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("user-info")), {
        timeout: 10_000
      })
      .not.toBeNull();
  });
});

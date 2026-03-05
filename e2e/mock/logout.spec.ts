import { test, expect } from "@playwright/test";

test.describe("退出登录（mock）", () => {
  test("点击退出系统应回到登录页", async ({ page }) => {
    await page.goto("/#/welcome");
    await expect(page.locator(".app-wrapper")).toBeVisible({ timeout: 30_000 });

    await page.locator(".el-dropdown-link").click();
    await page.getByRole("menuitem").filter({ hasText: "退出系统" }).click();

    await expect(page).toHaveURL(/\/#\/login/);
    await expect(
      page.getByRole("button", { name: "登录", exact: true })
    ).toBeVisible();
  });
});

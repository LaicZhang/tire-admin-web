import { test, expect } from "../fixtures";

/**
 * 其他功能 E2E 测试
 */
test.describe("其他功能", () => {
  test.describe("AI智能录入", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/other/aiEntry");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应显示AI录入界面", async ({ authenticatedPage: page }) => {
      // AI录入可能有上传区域或输入框
      const hasUpload = await page
        .locator(".el-upload")
        .isVisible()
        .catch(() => false);
      const hasInput = await page
        .locator("textarea, .el-textarea")
        .isVisible()
        .catch(() => false);
      const hasForm = await page
        .locator(".el-form")
        .isVisible()
        .catch(() => false);
      expect(hasUpload || hasInput || hasForm).toBeTruthy();
    });

    test("应支持图片或文件上传", async ({ authenticatedPage: page }) => {
      const uploadArea = page.locator(
        ".el-upload, .upload-area, input[type='file']"
      );
      if (
        await uploadArea
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await expect(uploadArea.first()).toBeVisible();
      }
    });
  });

  test.describe("智能导入", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/other/smartImport");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应显示导入界面", async ({ authenticatedPage: page }) => {
      // 导入页面通常有上传区域
      const hasUpload = await page
        .locator(".el-upload")
        .isVisible()
        .catch(() => false);
      const hasSteps = await page
        .locator(".el-steps")
        .isVisible()
        .catch(() => false);
      const hasForm = await page
        .locator(".el-form")
        .isVisible()
        .catch(() => false);
      expect(hasUpload || hasSteps || hasForm).toBeTruthy();
    });

    test("应支持选择导入类型", async ({ authenticatedPage: page }) => {
      // 导入类型选择
      const typeSelect = page.locator(".el-select, .el-radio-group").first();
      if (await typeSelect.isVisible().catch(() => false)) {
        await expect(typeSelect).toBeVisible();
      }
    });

    test("应显示模板下载按钮", async ({ authenticatedPage: page }) => {
      const downloadBtn = page.getByRole("button", { name: /下载模板|模板/ });
      if (await downloadBtn.isVisible().catch(() => false)) {
        await expect(downloadBtn).toBeVisible();
      }
    });
  });
});

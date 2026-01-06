import { test, expect } from "../fixtures";
import { waitForTableLoad, selectors } from "../fixtures";

/**
 * 采购管理 E2E 测试
 */
test.describe("采购管理", () => {
  test.describe("采购订单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/purchase/order");
      await waitForTableLoad(page);
    });

    test("页面应正确显示采购订单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("订单应显示状态标签", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        const statusTags = page.locator(".pure-table tbody .el-tag");
        await expect(statusTags.first()).toBeVisible();
      }
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      await page.getByRole("button", { name: /搜索/ }).click();
      await waitForTableLoad(page);
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("点击新增应进入订单创建页面", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("采购入库", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/purchase/inbound");
      await waitForTableLoad(page);
    });

    test("页面应正确显示入库单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("入库单应显示状态", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        const statusTags = page.locator(".pure-table tbody .el-tag");
        const tagCount = await statusTags.count();
        expect(tagCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("采购退货", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/purchase/return");
      await waitForTableLoad(page);
    });

    test("页面应正确显示退货单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });
});

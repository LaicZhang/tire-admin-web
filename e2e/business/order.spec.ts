import { test, expect } from "../fixtures";
import { waitForTableLoad, selectors } from "../fixtures";

/**
 * 订单管理 E2E 测试
 */
test.describe("订单管理", () => {
  test.describe("销售订单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/business/order/sale");
      await waitForTableLoad(page);
    });

    test("页面应正确显示销售订单列表", async ({ authenticatedPage: page }) => {
      // 验证表格存在
      await expect(page.locator(selectors.table)).toBeVisible();

      // 验证分页组件存在
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("订单列表应显示状态标签", async ({ authenticatedPage: page }) => {
      await waitForTableLoad(page);

      const rowCount = await page.locator(".pure-table tbody tr").count();

      if (rowCount > 0) {
        // 订单通常有状态列
        const statusTags = page.locator(".pure-table tbody .el-tag");
        await expect(statusTags.first()).toBeVisible();
      }
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      // 点击搜索按钮（使用现有条件）
      await page.getByRole("button", { name: /搜索/ }).click();

      // 等待表格刷新
      await waitForTableLoad(page);

      // 验证表格仍然可见
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("表格应支持分页", async ({ authenticatedPage: page }) => {
      await waitForTableLoad(page);

      // 验证分页组件存在
      const pagination = page.locator(selectors.pagination);
      await expect(pagination).toBeVisible();

      // 检查是否有下一页按钮
      const nextBtn = pagination.locator(".btn-next");
      await expect(nextBtn).toBeVisible();
    });
  });

  test.describe("采购订单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/business/order/purchase");
      await waitForTableLoad(page);
    });

    test("页面应正确显示采购订单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("采购订单搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      await page.getByRole("button", { name: /搜索/ }).click();
      await waitForTableLoad(page);
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });
});

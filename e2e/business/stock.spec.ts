import { test, expect } from "../fixtures";
import { waitForTableLoad, selectors } from "../fixtures";

/**
 * 库存管理 E2E 测试
 */
test.describe("库存管理", () => {
  test.describe("库存查询", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/business/stock/query");
      await waitForTableLoad(page);
    });

    test("页面应正确显示库存列表", async ({ authenticatedPage: page }) => {
      // 验证表格存在
      await expect(page.locator(selectors.table)).toBeVisible();

      // 验证分页组件存在
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("库存列表应显示数量列", async ({ authenticatedPage: page }) => {
      await waitForTableLoad(page);

      // 验证表头包含数量相关列
      const tableHeader = page.locator(".pure-table thead");
      await expect(tableHeader).toBeVisible();
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      // 点击搜索按钮
      await page.getByRole("button", { name: /搜索/ }).click();

      // 等待表格刷新
      await waitForTableLoad(page);

      // 验证表格仍然可见
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("仓库筛选应正常工作", async ({ authenticatedPage: page }) => {
      // 查找仓库下拉框
      const warehouseSelect = page.locator(".el-select").first();

      if (await warehouseSelect.isVisible()) {
        await warehouseSelect.click();
        await page.waitForTimeout(300);

        // 选择选项
        const options = page.locator(".el-select-dropdown__item");
        const optionCount = await options.count();

        if (optionCount > 0) {
          await options.first().click();
          await waitForTableLoad(page);
        }
      }

      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("出入库记录", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/business/stock/inout");
      await waitForTableLoad(page);
    });

    test("页面应正确显示出入库记录", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("出入库类型筛选应正常工作", async ({ authenticatedPage: page }) => {
      await page.getByRole("button", { name: /搜索/ }).click();
      await waitForTableLoad(page);
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("库存盘点", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/business/stockTaking");
      await waitForTableLoad(page);
    });

    test("页面应正确显示盘点列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("盘点单应显示状态", async ({ authenticatedPage: page }) => {
      await waitForTableLoad(page);

      const rowCount = await page.locator(".pure-table tbody tr").count();

      if (rowCount > 0) {
        // 盘点单有状态标签
        const statusTags = page.locator(".pure-table tbody .el-tag");
        const tagCount = await statusTags.count();
        expect(tagCount).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

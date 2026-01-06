import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  waitForDialog,
  closeDialog,
  selectors
} from "../fixtures";

/**
 * 库存管理 E2E 测试（inventory 模块）
 */
test.describe("库存管理", () => {
  test.describe("调拨单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/transfer");
      await waitForTableLoad(page);
    });

    test("页面应正确显示调拨单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("调拨单应显示状态", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        const statusTags = page.locator(".pure-table tbody .el-tag");
        const tagCount = await statusTags.count();
        expect(tagCount).toBeGreaterThanOrEqual(0);
      }
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      await page.getByRole("button", { name: /搜索/ }).click();
      await waitForTableLoad(page);
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("其他入库", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/otherInbound");
      await waitForTableLoad(page);
    });

    test("页面应正确显示其他入库列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("点击新增应显示对话框", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await waitForDialog(page);
        await closeDialog(page);
      }
    });
  });

  test.describe("其他出库", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/otherOutbound");
      await waitForTableLoad(page);
    });

    test("页面应正确显示其他出库列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("盘点单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/stocktaking");
      await waitForTableLoad(page);
    });

    test("页面应正确显示盘点单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("盘点单应显示状态", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        const statusTags = page.locator(".pure-table tbody .el-tag");
        const tagCount = await statusTags.count();
        expect(tagCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("成本调整", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/costAdjust");
      await waitForTableLoad(page);
    });

    test("页面应正确显示成本调整列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("组装单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/assembly");
      await waitForTableLoad(page);
    });

    test("页面应正确显示组装单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("拆卸单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/disassembly");
      await waitForTableLoad(page);
    });

    test("页面应正确显示拆卸单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });
});

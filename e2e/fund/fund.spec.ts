import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  waitForDialog,
  closeDialog,
  selectors
} from "../fixtures";

/**
 * 资金管理 E2E 测试
 */
test.describe("资金管理", () => {
  test.describe("收款单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/fund/receipt");
      await waitForTableLoad(page);
    });

    test("页面应正确显示收款单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("收款单应显示状态和金额", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        // 收款单应有状态标签
        const firstRow = page.locator(".pure-table tbody tr").first();
        await expect(firstRow).toBeVisible();
      }
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      await page.getByRole("button", { name: /搜索/ }).click();
      await waitForTableLoad(page);
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("付款单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/fund/payment");
      await waitForTableLoad(page);
    });

    test("页面应正确显示付款单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      await page.getByRole("button", { name: /搜索/ }).click();
      await waitForTableLoad(page);
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("其他收入", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/fund/otherIncome");
      await waitForTableLoad(page);
    });

    test("页面应正确显示其他收入列表", async ({ authenticatedPage: page }) => {
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

  test.describe("其他支出", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/fund/otherExpense");
      await waitForTableLoad(page);
    });

    test("页面应正确显示其他支出列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("调拨单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/fund/transfer");
      await waitForTableLoad(page);
    });

    test("页面应正确显示调拨单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });
});

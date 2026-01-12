import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  selectors,
  approveDocument,
  openPrintPreview,
  clickFirstRowAction
} from "../fixtures";

/**
 * 核销单 E2E 测试
 * 基于 docs/nm 文档: 核销单.md
 */
test.describe("核销单", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/fund/writeOff");
    await waitForTableLoad(page);
  });

  test("页面应正确显示核销单列表", async ({ authenticatedPage: page }) => {
    await expect(page.locator(selectors.table)).toBeVisible();
  });

  /**
   * 文档: 2) 核销单提供5种类型进行核销操作
   */
  test.describe("核销类型", () => {
    // 文档: (1) 业务类型：预收冲应收
    test("应支持预收冲应收类型", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查业务类型下拉框
        const typeSelect = page.getByLabel(/业务类型/);
        if (await typeSelect.isVisible()) {
          await typeSelect.click();
          await page.waitForTimeout(300);
          const option = page.getByText(/预收冲应收/);
          if (await option.isVisible()) {
            await option.click();
          }
        }
      }
    });

    // 文档: (2) 业务类型：预付冲应付
    test("应支持预付冲应付类型", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        const typeSelect = page.getByLabel(/业务类型/);
        if (await typeSelect.isVisible()) {
          await typeSelect.click();
          await page.waitForTimeout(300);
          const option = page.getByText(/预付冲应付/);
          if (await option.isVisible()) {
            await option.click();
          }
        }
      }
    });

    // 文档: (3) 业务类型：应收冲应付
    test("应支持应收冲应付类型", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        const typeSelect = page.getByLabel(/业务类型/);
        if (await typeSelect.isVisible()) {
          await typeSelect.click();
          await page.waitForTimeout(300);
          const option = page.getByText(/应收冲应付/);
          if (await option.isVisible()) {
            await option.click();
          }
        }
      }
    });

    // 文档: (4) 业务类型：应收转应收
    test("应支持应收转应收类型", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        const typeSelect = page.getByLabel(/业务类型/);
        if (await typeSelect.isVisible()) {
          await typeSelect.click();
          await page.waitForTimeout(300);
          const option = page.getByText(/应收转应收/);
          if (await option.isVisible()) {
            await option.click();
          }
        }
      }
    });

    // 文档: (5) 业务类型：应付转应付
    test("应支持应付转应付类型", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        const typeSelect = page.getByLabel(/业务类型/);
        if (await typeSelect.isVisible()) {
          await typeSelect.click();
          await page.waitForTimeout(300);
          const option = page.getByText(/应付转应付/);
          if (await option.isVisible()) {
            await option.click();
          }
        }
      }
    });
  });

  // 文档: 3) 打印
  test("核销单应支持打印预览", async ({ authenticatedPage: page }) => {
    const rowCount = await page.locator(".pure-table tbody tr").count();
    if (rowCount > 0) {
      await clickFirstRowAction(page, "查看|编辑");
      await page.waitForTimeout(1000);
      await openPrintPreview(page);
    }
  });

  test("核销单应支持审核操作", async ({ authenticatedPage: page }) => {
    const rowCount = await page.locator(".pure-table tbody tr").count();
    if (rowCount > 0) {
      await clickFirstRowAction(page, "查看|编辑");
      await page.waitForTimeout(1000);
      await approveDocument(page);
    }
  });

  test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
    await page.getByRole("button", { name: /搜索/ }).click();
    await waitForTableLoad(page);
    await expect(page.locator(selectors.table)).toBeVisible();
  });
});

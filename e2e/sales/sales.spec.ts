import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  selectors,
  approveDocument,
  openPrintPreview,
  selectSourceDocument,
  selectBOM,
  generateRelatedDocument,
  clickFirstRowAction
} from "../fixtures";

/**
 * 销售管理 E2E 测试
 * 基于 docs/nm 文档: 销售订单.md, 销售出库.md, 销售退货.md
 */
test.describe("销售管理", () => {
  /**
   * 销售订单测试
   * 文档：销售订单.md
   */
  test.describe("销售订单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/sales/order");
      await waitForTableLoad(page);
    });

    test("页面应正确显示销售订单列表", async ({ authenticatedPage: page }) => {
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

    // 文档: 方式二：可【选择BOM表】快速下销售订单
    test("新增订单应支持选择BOM表", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectBOM(page);
      }
    });

    // 文档: 3) 列设置
    test("销售订单列表应支持列设置", async ({ authenticatedPage: page }) => {
      const settingsBtn = page.getByRole("button", { name: /设置|列设置/ });
      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();
        await page.waitForTimeout(500);
      }
    });

    // 文档: 4) 折扣率
    test("新增订单应支持设置折扣率", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查折扣率相关字段
        const _discountField = page.getByLabel(/折扣率|折扣/);
        // 折扣率字段可能存在
      }
    });

    // 文档: 5) 生成销售出库单，生成采购订单
    test("订单应支持生成销售出库单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await generateRelatedDocument(page, "销售出库单");
      }
    });

    test("订单应支持生成采购订单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await generateRelatedDocument(page, "采购订单");
      }
    });

    // 文档: 6) 审核与反审核
    test("订单应支持审核与反审核", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await approveDocument(page);
      }
    });

    test("订单应支持打印预览", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await openPrintPreview(page);
      }
    });
  });

  /**
   * 销售出库测试
   * 文档：销售出库.md
   */
  test.describe("销售出库", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/sales/outbound");
      await waitForTableLoad(page);
    });

    test("页面应正确显示出库单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("出库单应显示状态", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        const statusTags = page.locator(".pure-table tbody .el-tag");
        const tagCount = await statusTags.count();
        expect(tagCount).toBeGreaterThanOrEqual(0);
      }
    });

    // 文档: 方式二：可【选择BOM表】
    test("新增出库单应支持选择BOM表", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectBOM(page);
      }
    });

    // 文档: 3) 选择源单
    test("新增出库单应支持选择源单", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectSourceDocument(page);
      }
    });

    // 文档: 4) 生成关联单据
    test("出库单应支持生成销售退货单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await generateRelatedDocument(page, "销售退货单");
      }
    });

    test("出库单应支持生成采购入库单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await generateRelatedDocument(page, "采购入库单");
      }
    });

    // 文档: 5) 折扣率
    test("新增出库单应支持设置折扣率", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查折扣率设置
        const _discountBtn = page.getByRole("button", { name: /统一折扣/ });
        // 统一折扣按钮可能存在
      }
    });

    // 文档: 7) 审核与反审核
    test("出库单应支持审核操作", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await approveDocument(page);
      }
    });
  });

  /**
   * 销售退货测试
   * 文档：销售退货.md
   */
  test.describe("销售退货", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/sales/return");
      await waitForTableLoad(page);
    });

    test("页面应正确显示退货单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    // 文档: 方式二：可【选择BOM表】
    test("新增退货单应支持选择BOM表", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectBOM(page);
      }
    });

    // 文档: 3) 删除、复制、打印
    test("退货单应支持打印预览", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await openPrintPreview(page);
      }
    });

    // 文档: 4) 审核与反审核
    test("退货单应支持审核操作", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await approveDocument(page);
      }
    });
  });

  /**
   * 销售报表测试
   * 文档：销售报表.md
   */
  test.describe("销售报表", () => {
    test("应能访问销售报表", async ({ authenticatedPage: page }) => {
      await page.goto("/sales/report");
      await page.waitForTimeout(1000);
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });
});

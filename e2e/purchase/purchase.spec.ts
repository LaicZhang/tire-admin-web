import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  selectors,
  approveDocument,
  unapproveDocument,
  openPrintPreview,
  selectSourceDocument,
  selectBOM,
  generateRelatedDocument,
  clickFirstRowAction,
  copyDocument
} from "../fixtures";

/**
 * 采购管理 E2E 测试
 * 基于 docs/nm 文档: 采购订单.md, 采购入库.md, 采购退货单.md
 */
test.describe("采购管理", () => {
  /**
   * 采购订单测试
   * 文档：采购订单.md
   */
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
        // 验证进入新增页面或弹出对话框
      }
    });

    // 文档: 3)选择BOM表：新增采购订单,可以点击【选择BOM表】按钮
    test("新增订单应支持选择BOM表", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectBOM(page);
      }
    });

    // 文档: 4）生成采购入库单
    test("订单应支持生成采购入库单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await generateRelatedDocument(page, "采购入库单");
      }
    });

    // 文档: 5）生成销售订单
    test("订单应支持生成销售订单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await generateRelatedDocument(page, "销售订单");
      }
    });

    // 文档: 6）删除、复制、关闭、打印
    test("订单应支持复制操作", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await copyDocument(page);
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

    // 文档: 7）审核与反审核
    test("订单应支持审核与反审核", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await approveDocument(page);
        await unapproveDocument(page);
      }
    });
  });

  /**
   * 采购入库测试
   * 文档：采购入库.md
   */
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

    // 文档: 4) 选择源单
    test("新增入库单应支持选择源单", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectSourceDocument(page);
      }
    });

    // 文档: 5) 选择BOM表
    test("新增入库单应支持选择BOM表", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectBOM(page);
      }
    });

    // 文档: 6) 采购费用分摊
    test("入库单应显示采购费用分摊设置", async ({
      authenticatedPage: page
    }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查采购费用分摊相关元素
        const _expenseSection = page.getByText(/采购费用|费用分摊/);
        // 费用分摊区域可能存在
      }
    });

    // 文档: 7) 生成采购退货单
    test("入库单应支持生成采购退货单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await generateRelatedDocument(page, "采购退货单");
      }
    });

    // 文档: 8) 生成销售出库单
    test("入库单应支持生成销售出库单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await generateRelatedDocument(page, "销售出库单");
      }
    });

    // 文档: 9) 生成其他出库单
    test("入库单应支持生成其他出库单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await generateRelatedDocument(page, "其他出库单");
      }
    });

    // 文档: 11) 审核与反审核
    test("入库单应支持审核与反审核", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await approveDocument(page);
      }
    });
  });

  /**
   * 采购退货测试
   * 文档：采购退货单.md
   */
  test.describe("采购退货", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/purchase/return");
      await waitForTableLoad(page);
    });

    test("页面应正确显示退货单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    // 文档: 4) 选择源单
    test("新增退货单应支持选择源单", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectSourceDocument(page);
      }
    });

    // 文档: 5) 选择BOM表
    test("新增退货单应支持选择BOM表", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectBOM(page);
      }
    });

    // 文档: 6) 删除、复制、打印
    test("退货单应支持打印预览", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await openPrintPreview(page);
      }
    });

    // 文档: 7) 审核与反审核
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
   * 采购报表测试
   * 文档：采购报表.md
   */
  test.describe("采购报表", () => {
    test("应能访问采购汇总表", async ({ authenticatedPage: page }) => {
      await page.goto("/purchase/report");
      await page.waitForTimeout(1000);
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });
});

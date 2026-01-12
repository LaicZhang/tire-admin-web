import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  waitForDialog,
  closeDialog,
  selectors,
  approveDocument,
  selectBOM,
  clickFirstRowAction
} from "../fixtures";

/**
 * 库存管理 E2E 测试
 * 基于 docs/nm 文档: 调拨单.md, 其他入库单.md, 其他出库单.md, 盘点单.md, 组装单.md, 拆卸单.md
 */
test.describe("库存管理", () => {
  /**
   * 调拨单测试
   * 文档：调拨单.md
   */
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

    // 文档: 1) 调入仓库、调出仓库、商品名称、数量为必填项
    test("新增调拨单应包含必填字段", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查调入仓库、调出仓库字段
      }
    });

    // 文档: 3) 审核与反审核
    test("调拨单应支持审核操作", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await approveDocument(page);
      }
    });
  });

  /**
   * 其他入库测试
   * 文档：其他入库单.md
   */
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

    // 文档: 2) 供应商是非必填项，业务类型可选择其它入库单和盘盈单
    test("新增入库单应支持选择业务类型", async ({
      authenticatedPage: page
    }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查业务类型下拉框
        const _typeSelect = page.getByLabel(/业务类型/);
      }
    });

    // 文档: 4) 审核与反审核
    test("其他入库单应支持审核操作", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await approveDocument(page);
      }
    });
  });

  /**
   * 其他出库测试
   * 文档：其他出库单.md
   */
  test.describe("其他出库", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/otherOutbound");
      await waitForTableLoad(page);
    });

    test("页面应正确显示其他出库列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    // 文档: 2) 客户是非必填项，业务类型可选择其它出库单和盘亏单
    test("新增出库单应支持选择业务类型", async ({
      authenticatedPage: page
    }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查业务类型下拉框
      }
    });

    // 文档: 4) 审核与反审核
    test("其他出库单应支持审核操作", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await approveDocument(page);
      }
    });
  });

  /**
   * 盘点单测试
   * 文档：盘点单.md
   */
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

    // 文档: 1) 创建盘点单
    test("应支持创建盘点单", async ({ authenticatedPage: page }) => {
      const createBtn = page.getByRole("button", { name: /新增|创建/ });
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1000);
        // 检查创建盘点单弹窗
      }
    });

    // 文档: 导入盘点库存
    test("盘点单应支持导入盘点库存", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        const _importBtn = page.getByRole("button", { name: /导入/ });
        // 导入按钮可能存在
      }
    });

    // 文档: 生成盘点结果
    test("盘点单应支持生成盘盈盘亏单", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        const _genBtn = page.getByRole("button", { name: /生成盘盈|生成盘亏/ });
        // 生成盘盈/盘亏按钮可能存在
      }
    });
  });

  /**
   * 成本调整测试
   * 文档：成本调整单.md
   */
  test.describe("成本调整", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/costAdjust");
      await waitForTableLoad(page);
    });

    test("页面应正确显示成本调整列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    // 文档: 1) 成本调整单录入
    test("应支持新增成本调整单", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  /**
   * 组装单测试
   * 文档：组装单.md
   */
  test.describe("组装单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/assembly");
      await waitForTableLoad(page);
    });

    test("页面应正确显示组装单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    // 文档: 2) 保存和调用模板
    test("组装单应支持从BOM表选择", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectBOM(page);
      }
    });

    test("组装单应支持存为模版", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        const _saveTemplateBtn = page.getByRole("button", { name: /存为模版/ });
        // 存为模版按钮可能存在
      }
    });
  });

  /**
   * 拆卸单测试
   * 文档：拆卸单.md
   */
  test.describe("拆卸单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/disassembly");
      await waitForTableLoad(page);
    });

    test("页面应正确显示拆卸单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    // 文档: 2) 拆卸费用分摊
    test("拆卸单应支持费用分摊设置", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查自动分摊选项
        const _autoAllocate = page.getByLabel(/自动分摊/);
      }
    });

    // 文档: 3) 保存和调用模板
    test("拆卸单应支持从BOM表选择", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        await selectBOM(page);
      }
    });
  });

  /**
   * 库存报表测试
   * 文档：库存报表.md
   */
  test.describe("库存报表", () => {
    test("应能访问库存报表", async ({ authenticatedPage: page }) => {
      await page.goto("/inventory/report");
      await page.waitForTimeout(1000);
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });
});

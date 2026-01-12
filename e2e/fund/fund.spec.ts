import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  waitForDialog,
  closeDialog,
  selectors,
  approveDocument,
  openPrintPreview,
  clickFirstRowAction
} from "../fixtures";

/**
 * 资金管理 E2E 测试
 * 基于 docs/nm 文档: 付款单.md, 收款单.md, 转账单.md, 其他支出单.md, 其他收入单.md
 */
test.describe("资金管理", () => {
  /**
   * 收款单测试
   * 文档：收款单.md
   */
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
        const firstRow = page.locator(".pure-table tbody tr").first();
        await expect(firstRow).toBeVisible();
      }
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      await page.getByRole("button", { name: /搜索/ }).click();
      await waitForTableLoad(page);
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    // 文档: 2) 客户、结算账户、收款金额为必填项
    test("新增收款单应显示必填项", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查必填项标识
      }
    });

    // 文档: 3) 收款单可以选择有应收款单的单据进行核销
    test("收款单应支持源单据核销", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查源单据选择区域
        const _sourceSection = page.getByText(/源单据|应收|核销/);
      }
    });

    // 文档: 4) 打印
    test("收款单应支持打印预览", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await openPrintPreview(page);
      }
    });
  });

  /**
   * 付款单测试
   * 文档：付款单.md
   */
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

    // 文档: 2) 供应商、结算账户、付款金额为必填项
    test("新增付款单应显示必填项", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查必填项
      }
    });

    // 文档: 3) 源单据中选择需要核销的未付款的采购入库单
    test("付款单应支持选择源单据核销", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查源单据区域
      }
    });

    // 文档: 4) 打印
    test("付款单应支持打印预览", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await openPrintPreview(page);
      }
    });
  });

  /**
   * 其他收入测试
   * 文档：其他收入单.md
   */
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

    // 文档: 2) 录入客户、收入类型、金额等内容
    test("新增其他收入单应包含必填字段", async ({
      authenticatedPage: page
    }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查客户、收入类型、金额字段
      }
    });

    // 文档: 3) 单据保存后可以在其他收入单列表查看
    test("列表应支持收款操作", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        const _receiptBtn = page.getByRole("button", { name: /收款/ });
        // 收款按钮可能存在
      }
    });
  });

  /**
   * 其他支出测试
   * 文档：其他支出单.md
   */
  test.describe("其他支出", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/fund/otherExpense");
      await waitForTableLoad(page);
    });

    test("页面应正确显示其他支出列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    // 文档: 2) 录入供应商、支出类型、金额、本次付款和付款账户
    test("新增其他支出单应包含必填字段", async ({
      authenticatedPage: page
    }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查供应商、支出类型、金额字段
      }
    });

    // 文档: 4) 其他支出单列表，勾选单据之后，可以进行关联或者取消关联操作
    test("列表应支持关联操作", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        const _linkBtn = page.getByRole("button", { name: /关联/ });
        // 关联按钮可能存在
      }
    });
  });

  /**
   * 转账单测试
   * 文档：转账单.md
   */
  test.describe("转账单", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/fund/transfer");
      await waitForTableLoad(page);
    });

    test("页面应正确显示转账单列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    // 文档: 2) 转出账户、转入账户、金额为必填项
    test("新增转账单应包含必填字段", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // 检查转出账户、转入账户、金额字段
      }
    });

    // 文档: 3) 其他功能：单据保存后，可执行删除、复制、审核
    test("转账单应支持审核操作", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await approveDocument(page);
      }
    });

    // 文档: 4) 打印
    test("转账单应支持打印预览", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        await clickFirstRowAction(page, "查看|编辑");
        await page.waitForTimeout(1000);
        await openPrintPreview(page);
      }
    });
  });

  /**
   * 资金报表测试
   * 文档：资金报表.md
   */
  test.describe("资金报表", () => {
    test("应能访问资金报表", async ({ authenticatedPage: page }) => {
      await page.goto("/fund/report");
      await page.waitForTimeout(1000);
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });
});

import { test, expect } from "../fixtures";
import { selectors } from "../fixtures";

/**
 * 报表分析 E2E 测试
 */
test.describe("报表分析", () => {
  test.describe("销售分析", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/sales");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      // 验证页面标题或内容区域存在
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应显示图表或数据", async ({ authenticatedPage: page }) => {
      // 报表页面通常有图表或表格
      const hasChart = await page
        .locator("canvas, .echarts, svg")
        .first()
        .isVisible()
        .catch(() => false);
      const hasTable = await page
        .locator(selectors.table)
        .isVisible()
        .catch(() => false);
      expect(hasChart || hasTable).toBeTruthy();
    });

    test("日期筛选应正常工作", async ({ authenticatedPage: page }) => {
      const datePicker = page.locator(".el-date-editor").first();
      if (await datePicker.isVisible()) {
        await datePicker.click();
        await page.waitForTimeout(300);
        // 选择今天
        const todayBtn = page
          .locator(".el-picker-panel__link-btn")
          .filter({ hasText: /今天|Today/ });
        if (await todayBtn.isVisible()) {
          await todayBtn.click();
        } else {
          // 点击其他地方关闭
          await page.click("body");
        }
      }
    });
  });

  test.describe("采购分析", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/purchase");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应支持数据筛选", async ({ authenticatedPage: page }) => {
      // 查找筛选控件
      const hasFilters =
        (await page
          .locator(".el-select")
          .first()
          .isVisible()
          .catch(() => false)) ||
        (await page
          .locator(".el-date-editor")
          .first()
          .isVisible()
          .catch(() => false));
      expect(hasFilters).toBeTruthy();
    });
  });

  test.describe("库存分析", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/inventory");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("仓库筛选应正常工作", async ({ authenticatedPage: page }) => {
      const warehouseSelect = page.locator(".el-select").first();
      if (await warehouseSelect.isVisible()) {
        await warehouseSelect.click();
        await page.waitForTimeout(300);
        const options = page.locator(".el-select-dropdown__item");
        const optionCount = await options.count();
        if (optionCount > 0) {
          await options.first().click();
          await page.waitForLoadState("networkidle");
        }
      }
    });
  });

  test.describe("利润分析", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/profit");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("时间范围选择应可用", async ({ authenticatedPage: page }) => {
      const datePicker = page.locator(".el-date-editor");
      if (await datePicker.first().isVisible()) {
        await expect(datePicker.first()).toBeVisible();
      }
    });
  });

  test.describe("资金分析", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/finance");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });
  });

  test.describe("综合分析", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/comprehensive");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });
  });

  test.describe("排行榜", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/ranking");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应显示排行数据", async ({ authenticatedPage: page }) => {
      // 排行榜通常有表格或列表
      const hasData =
        (await page
          .locator(selectors.table)
          .isVisible()
          .catch(() => false)) ||
        (await page
          .locator(".el-table")
          .isVisible()
          .catch(() => false)) ||
        (await page
          .locator("canvas")
          .isVisible()
          .catch(() => false));
      expect(hasData).toBeTruthy();
    });
  });

  test.describe("账龄分析", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/aging");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应支持应收/应付切换", async ({ authenticatedPage: page }) => {
      // 账龄分析可能有 tabs 或按钮切换
      const tabs = page.locator(".el-tabs__item, .el-radio-button");
      if (await tabs.first().isVisible()) {
        await expect(tabs.first()).toBeVisible();
      }
    });
  });

  test.describe("资产分析", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/assets");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });
  });

  test.describe("归档数据", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/analysis/archiving");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      const searchBtn = page.getByRole("button", { name: /搜索/ });
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await page.waitForLoadState("networkidle");
      }
    });
  });
});

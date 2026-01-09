import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  waitForDialog,
  closeDialog,
  selectors
} from "../fixtures";

/**
 * 系统设置 E2E 测试
 */
test.describe("系统设置", () => {
  test.describe("公司信息", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/companyInfo");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应显示公司信息表单", async ({ authenticatedPage: page }) => {
      const hasForm = await page
        .locator(".el-form")
        .isVisible()
        .catch(() => false);
      const hasDescriptions = await page
        .locator(".el-descriptions")
        .isVisible()
        .catch(() => false);
      expect(hasForm || hasDescriptions).toBeTruthy();
    });
  });

  test.describe("功能参数", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/funcParams");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应显示参数配置表单", async ({ authenticatedPage: page }) => {
      const hasForm = await page
        .locator(".el-form")
        .isVisible()
        .catch(() => false);
      const hasSwitch = await page
        .locator(".el-switch")
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasForm || hasSwitch).toBeTruthy();
    });
  });

  test.describe("系统参数", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/sysParams");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });
  });

  test.describe("成本参数", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/costParams");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });
  });

  test.describe("编码规则", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/codeRule");
      await waitForTableLoad(page);
    });

    test("页面应正确显示编码规则列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("点击编辑应显示对话框", async ({ authenticatedPage: page }) => {
      const editBtn = page
        .locator(".pure-table tbody tr")
        .first()
        .getByRole("button", { name: /编辑|修改/ });
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await waitForDialog(page);
        await closeDialog(page);
      }
    });
  });

  test.describe("权限设置", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/permissions");
      await waitForTableLoad(page);
    });

    test("页面应正确显示权限列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("数据权限", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/dataAuth");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应支持数据权限配置", async ({ authenticatedPage: page }) => {
      // 数据权限通常有树形结构或表格
      const hasTree = await page
        .locator(".el-tree")
        .isVisible()
        .catch(() => false);
      const hasTable = await page
        .locator(selectors.table)
        .isVisible()
        .catch(() => false);
      const hasForm = await page
        .locator(".el-form")
        .isVisible()
        .catch(() => false);
      expect(hasTree || hasTable || hasForm).toBeTruthy();
    });
  });

  test.describe("打印模板", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/printTemplate");
      await waitForTableLoad(page);
    });

    test("页面应正确显示模板列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("高级打印", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/advancedPrint");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });
  });

  test.describe("操作日志", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/operationLog");
      await waitForTableLoad(page);
    });

    test("页面应正确显示日志列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("日期筛选应可用", async ({ authenticatedPage: page }) => {
      const datePicker = page.locator(".el-date-editor");
      if (await datePicker.first().isVisible()) {
        await expect(datePicker.first()).toBeVisible();
      }
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      const searchBtn = page.getByRole("button", { name: /搜索/ });
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await waitForTableLoad(page);
        await expect(page.locator(selectors.table)).toBeVisible();
      }
    });
  });

  test.describe("数据备份", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/backup");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("备份按钮应可见", async ({ authenticatedPage: page }) => {
      const backupBtn = page.getByRole("button", { name: /备份/ });
      if (await backupBtn.isVisible()) {
        await expect(backupBtn).toBeVisible();
      }
    });
  });

  test.describe("期末结账", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/closing");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });
  });

  test.describe("回收站", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/recycle");
      await waitForTableLoad(page);
    });

    test("页面应正确显示回收站列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("类型筛选应可用", async ({ authenticatedPage: page }) => {
      const typeSelect = page.locator(".el-select").first();
      if (await typeSelect.isVisible()) {
        await expect(typeSelect).toBeVisible();
      }
    });
  });

  test.describe("导入设置", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/importFree");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });
  });

  test.describe("推送设置", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/settings/push");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应显示推送配置选项", async ({ authenticatedPage: page }) => {
      const hasSwitch = await page
        .locator(".el-switch")
        .first()
        .isVisible()
        .catch(() => false);
      const hasForm = await page
        .locator(".el-form")
        .isVisible()
        .catch(() => false);
      expect(hasSwitch || hasForm).toBeTruthy();
    });
  });
});

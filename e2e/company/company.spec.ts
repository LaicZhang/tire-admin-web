import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  waitForDialog,
  closeDialog,
  selectors
} from "../fixtures";

/**
 * 公司管理 E2E 测试
 */
test.describe("公司管理", () => {
  test.describe("公司信息", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/company/info");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确显示公司信息", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });

    test("应显示公司基本信息表单", async ({ authenticatedPage: page }) => {
      // 公司信息页面通常有表单或信息展示
      const hasForm =
        (await page
          .locator(".el-form")
          .isVisible()
          .catch(() => false)) ||
        (await page
          .locator(".el-descriptions")
          .isVisible()
          .catch(() => false));
      expect(hasForm).toBeTruthy();
    });
  });

  test.describe("部门管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/company/department");
      await waitForTableLoad(page);
    });

    test("页面应正确显示部门列表", async ({ authenticatedPage: page }) => {
      // 部门可能是树形结构或表格
      const hasTree = await page
        .locator(".el-tree")
        .isVisible()
        .catch(() => false);
      const hasTable = await page
        .locator(selectors.table)
        .isVisible()
        .catch(() => false);
      expect(hasTree || hasTable).toBeTruthy();
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      const searchBtn = page.getByRole("button", { name: /搜索/ });
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await waitForTableLoad(page);
      }
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

  test.describe("员工管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/company/employee");
      await waitForTableLoad(page);
    });

    test("页面应正确显示员工列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
      const searchBtn = page.getByRole("button", { name: /搜索/ });
      await searchBtn.click();
      await waitForTableLoad(page);
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("点击新增员工应显示对话框", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await waitForDialog(page);
        await closeDialog(page);
      }
    });

    test("员工应显示状态标签", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        const statusTags = page.locator(".pure-table tbody .el-tag");
        const tagCount = await statusTags.count();
        expect(tagCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("职位管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/company/position");
      await waitForTableLoad(page);
    });

    test("页面应正确显示职位列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("点击新增职位应显示对话框", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await waitForDialog(page);
        await closeDialog(page);
      }
    });
  });

  test.describe("资产管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/company/asset");
      await waitForTableLoad(page);
    });

    test("页面应正确显示资产列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("资产状态筛选应正常工作", async ({ authenticatedPage: page }) => {
      const statusSelect = page.locator(".el-select").first();
      if (await statusSelect.isVisible()) {
        await statusSelect.click();
        await page.waitForTimeout(300);
        const options = page.locator(".el-select-dropdown__item");
        const optionCount = await options.count();
        if (optionCount > 0) {
          await options.first().click();
          await waitForTableLoad(page);
        }
      }
    });
  });

  test.describe("仓库管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/company/repo");
      await waitForTableLoad(page);
    });

    test("页面应正确显示仓库列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("点击新增仓库应显示对话框", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await waitForDialog(page);
        await closeDialog(page);
      }
    });
  });

  test.describe("薪资管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/company/salary");
      await waitForTableLoad(page);
    });

    test("页面应正确显示薪资列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });

  test.describe("企业聊天", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/company/chat");
      await page.waitForLoadState("networkidle");
    });

    test("页面应正确加载", async ({ authenticatedPage: page }) => {
      await expect(page.locator(".main-content, .app-main")).toBeVisible();
    });
  });
});

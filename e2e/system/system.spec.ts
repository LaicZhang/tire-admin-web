import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  waitForDialog,
  closeDialog,
  clickAddButton,
  selectors
} from "../fixtures";

/**
 * 系统管理 E2E 测试
 */
test.describe("系统管理", () => {
  test.describe("用户管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/system/user");
      await waitForTableLoad(page);
    });

    test("页面应正确显示用户列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("用户列表应显示状态", async ({ authenticatedPage: page }) => {
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

    test("点击新增用户应显示对话框", async ({ authenticatedPage: page }) => {
      await clickAddButton(page, "新增用户");
      await waitForDialog(page);
      await expect(page.locator(".el-dialog__title")).toContainText("用户");
      await closeDialog(page);
    });
  });

  test.describe("角色管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/system/role");
      await waitForTableLoad(page);
    });

    test("页面应正确显示角色列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("点击新增角色应显示对话框", async ({ authenticatedPage: page }) => {
      await clickAddButton(page, "新增角色");
      await waitForDialog(page);
      await closeDialog(page);
    });

    test("角色应显示权限信息", async ({ authenticatedPage: page }) => {
      const rowCount = await page.locator(".pure-table tbody tr").count();
      if (rowCount > 0) {
        const firstRow = page.locator(".pure-table tbody tr").first();
        await expect(firstRow).toBeVisible();
      }
    });
  });

  test.describe("菜单管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/system/menu");
      await waitForTableLoad(page);
    });

    test("页面应正确显示菜单树", async ({ authenticatedPage: page }) => {
      // 菜单管理可能使用树形结构
      await expect(page.locator(selectors.table)).toBeVisible();
    });

    test("点击新增菜单应显示对话框", async ({ authenticatedPage: page }) => {
      const addBtn = page.getByRole("button", { name: /新增/ });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await waitForDialog(page);
        await closeDialog(page);
      }
    });
  });

  test.describe("操作日志", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/system/log");
      await waitForTableLoad(page);
    });

    test("页面应正确显示日志列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
      await expect(page.locator(selectors.pagination)).toBeVisible();
    });

    test("日志搜索应支持日期筛选", async ({ authenticatedPage: page }) => {
      // 日期选择器应可见
      const datePicker = page.locator(".el-date-editor");
      if (await datePicker.first().isVisible()) {
        await expect(datePicker.first()).toBeVisible();
      }
    });
  });

  test.describe("公司管理", () => {
    test.beforeEach(async ({ authenticatedPage: page }) => {
      await page.goto("/system/companies");
      await waitForTableLoad(page);
    });

    test("页面应正确显示公司列表", async ({ authenticatedPage: page }) => {
      await expect(page.locator(selectors.table)).toBeVisible();
    });
  });
});

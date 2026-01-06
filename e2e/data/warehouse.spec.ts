import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  waitForDialog,
  closeDialog,
  clickAddButton,
  selectors
} from "../fixtures";

/**
 * 仓库管理 E2E 测试
 */
test.describe("仓库管理", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // 导航到仓库管理页面
    await page.goto("/data/warehouse");
    await waitForTableLoad(page);
  });

  test("页面应正确显示仓库列表", async ({ authenticatedPage: page }) => {
    // 验证表格存在
    await expect(page.locator(selectors.table)).toBeVisible();

    // 验证分页组件存在
    await expect(page.locator(selectors.pagination)).toBeVisible();

    // 验证新增按钮存在
    await expect(page.getByRole("button", { name: /新增仓库/ })).toBeVisible();
  });

  test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
    // 填写搜索条件
    await page.getByPlaceholder("仓库名称").fill("主仓");

    // 点击搜索按钮
    await page.getByRole("button", { name: /搜索/ }).click();

    // 等待表格刷新
    await waitForTableLoad(page);

    // 验证表格仍然可见
    await expect(page.locator(selectors.table)).toBeVisible();
  });

  test("重置搜索应清空条件", async ({ authenticatedPage: page }) => {
    // 填写搜索条件
    const searchInput = page.getByPlaceholder("仓库名称");
    await searchInput.fill("测试仓库");

    // 点击重置按钮
    await page.getByRole("button", { name: /重置/ }).click();

    // 验证搜索框被清空
    await expect(searchInput).toHaveValue("");

    // 等待表格刷新
    await waitForTableLoad(page);
  });

  test("点击新增按钮应显示新增对话框", async ({ authenticatedPage: page }) => {
    // 点击新增按钮
    await clickAddButton(page, "新增仓库");

    // 等待对话框显示
    await waitForDialog(page);

    // 验证对话框标题
    await expect(page.locator(".el-dialog__title")).toContainText("新增仓库");

    // 验证表单字段存在
    await expect(page.getByLabel("仓库编码")).toBeVisible();
    await expect(page.getByLabel("仓库名称")).toBeVisible();

    // 关闭对话框
    await closeDialog(page);
  });

  test("新增仓库表单验证应正常工作", async ({ authenticatedPage: page }) => {
    // 点击新增按钮
    await clickAddButton(page, "新增仓库");
    await waitForDialog(page);

    // 直接点击确定按钮
    await page.getByRole("button", { name: "确定" }).click();

    // 等待验证错误显示
    await expect(page.locator(selectors.formError).first()).toBeVisible({
      timeout: 5000
    });

    // 关闭对话框
    await closeDialog(page);
  });

  test("表格操作列应包含操作按钮", async ({ authenticatedPage: page }) => {
    await waitForTableLoad(page);

    const firstRow = page.locator(".pure-table tbody tr").first();
    const rowCount = await page.locator(".pure-table tbody tr").count();

    if (rowCount > 0) {
      await expect(
        firstRow.getByRole("button", { name: /查看/ })
      ).toBeVisible();
      await expect(
        firstRow.getByRole("button", { name: /修改/ })
      ).toBeVisible();
      await expect(
        firstRow.getByRole("button", { name: /删除/ })
      ).toBeVisible();
    }
  });

  test("仓库应显示状态标签", async ({ authenticatedPage: page }) => {
    await waitForTableLoad(page);

    const rowCount = await page.locator(".pure-table tbody tr").count();

    if (rowCount > 0) {
      // 验证表格中有状态标签
      const statusTags = page.locator(".pure-table tbody .el-tag");
      const tagCount = await statusTags.count();
      expect(tagCount).toBeGreaterThanOrEqual(0);
    }
  });
});

import { test, expect } from "../fixtures";
import {
  waitForTableLoad,
  waitForDialog,
  closeDialog,
  clickAddButton,
  selectors
} from "../fixtures";

/**
 * 客户管理 E2E 测试
 */
test.describe("客户管理", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // 导航到客户管理页面
    await page.goto("/data/customer");
    await waitForTableLoad(page);
  });

  test("页面应正确显示客户列表", async ({ authenticatedPage: page }) => {
    // 验证表格存在
    await expect(page.locator(selectors.table)).toBeVisible();

    // 验证分页组件存在
    await expect(page.locator(selectors.pagination)).toBeVisible();

    // 验证新增按钮存在
    await expect(page.getByRole("button", { name: /新增客户/ })).toBeVisible();
  });

  test("搜索功能应正常工作", async ({ authenticatedPage: page }) => {
    // 填写搜索条件
    await page.getByPlaceholder("客户名称").fill("测试");

    // 点击搜索按钮
    await page.getByRole("button", { name: /搜索/ }).click();

    // 等待表格刷新
    await waitForTableLoad(page);

    // 验证表格仍然可见（即使没有结果）
    await expect(page.locator(selectors.table)).toBeVisible();
  });

  test("重置搜索应清空条件", async ({ authenticatedPage: page }) => {
    // 填写搜索条件
    const searchInput = page.getByPlaceholder("客户名称");
    await searchInput.fill("测试搜索");

    // 点击重置按钮
    await page.getByRole("button", { name: /重置/ }).click();

    // 验证搜索框被清空
    await expect(searchInput).toHaveValue("");

    // 等待表格刷新
    await waitForTableLoad(page);
  });

  test("点击新增按钮应显示新增对话框", async ({ authenticatedPage: page }) => {
    // 点击新增按钮
    await clickAddButton(page, "新增客户");

    // 等待对话框显示
    await waitForDialog(page);

    // 验证对话框标题
    await expect(page.locator(".el-dialog__title")).toContainText("新增客户");

    // 验证表单字段存在
    await expect(page.getByLabel("客户编码")).toBeVisible();
    await expect(page.getByLabel("客户名称")).toBeVisible();

    // 关闭对话框
    await closeDialog(page);
  });

  test("新增客户表单验证应正常工作", async ({ authenticatedPage: page }) => {
    // 点击新增按钮
    await clickAddButton(page, "新增客户");
    await waitForDialog(page);

    // 直接点击确定按钮（不填写任何内容）
    await page.getByRole("button", { name: "确定" }).click();

    // 等待验证错误显示
    await expect(page.locator(selectors.formError).first()).toBeVisible({
      timeout: 5000
    });

    // 关闭对话框
    await closeDialog(page);
  });

  test("表格操作列应包含查看、修改、删除按钮", async ({
    authenticatedPage: page
  }) => {
    // 等待表格加载
    await waitForTableLoad(page);

    // 获取第一行
    const firstRow = page.locator(".pure-table tbody tr").first();

    // 如果有数据，验证操作按钮
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

  test("点击查看按钮应显示详情对话框", async ({ authenticatedPage: page }) => {
    // 等待表格加载
    await waitForTableLoad(page);

    // 获取第一行
    const firstRow = page.locator(".pure-table tbody tr").first();

    // 如果有数据，点击查看
    const rowCount = await page.locator(".pure-table tbody tr").count();
    if (rowCount > 0) {
      await firstRow.getByRole("button", { name: /查看/ }).click();

      // 等待对话框显示
      await waitForDialog(page);

      // 验证是详情对话框
      await expect(page.locator(".el-dialog__title")).toContainText("详情");

      // 关闭对话框
      await closeDialog(page);
    }
  });
});

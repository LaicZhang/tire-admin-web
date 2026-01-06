import { test as base, expect, type Page } from "@playwright/test";

/**
 * 自定义测试 fixtures
 * 扩展 Playwright 的 test 对象，添加项目特定的测试工具
 */

// 定义 Page 类型用于辅助函数
type TestPage = Page;

// 已登录用户的 fixture
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // 执行登录
    await page.goto("/login");
    await page.getByPlaceholder("账号").fill("admin");
    await page.getByPlaceholder("密码").fill("admin123");
    await page.getByRole("button", { name: /登录/i }).click();
    await page.waitForURL(/\/(welcome|dashboard|home)/);
    await page.waitForLoadState("networkidle");
    // 使用已登录的页面
    await use(page);
  }
});

export { expect };

/**
 * 登录辅助函数
 */
export async function login(
  page: TestPage,
  username = "admin",
  password = "admin123"
) {
  await page.goto("/login");
  await page.getByPlaceholder("账号").fill(username);
  await page.getByPlaceholder("密码").fill(password);
  await page.getByRole("button", { name: /登录/i }).click();
  await page.waitForURL(/\/(welcome|dashboard|home)/);
}

/**
 * 等待页面加载完成
 */
export async function waitForPageLoad(page: TestPage) {
  await page.waitForLoadState("networkidle");
}

/**
 * 导航到指定菜单项
 * @param page 页面对象
 * @param menuPath 菜单路径，例如 ["基础数据", "客户管理"]
 */
export async function navigateToMenu(page: TestPage, menuPath: string[]) {
  for (const menuItem of menuPath) {
    await page.getByText(menuItem, { exact: true }).first().click();
    await page.waitForTimeout(300);
  }
  await waitForPageLoad(page);
}

/**
 * 点击新增按钮
 */
export async function clickAddButton(page: TestPage, buttonText = "新增") {
  await page.getByRole("button", { name: new RegExp(buttonText) }).click();
  await page.waitForTimeout(500);
}

/**
 * 等待对话框显示
 */
export async function waitForDialog(page: TestPage) {
  await expect(page.locator(".el-dialog")).toBeVisible();
}

/**
 * 关闭对话框
 */
export async function closeDialog(page: TestPage) {
  await page.locator(".el-dialog__headerbtn").click();
  await expect(page.locator(".el-dialog")).not.toBeVisible();
}

/**
 * 点击确认按钮
 */
export async function confirmDialog(page: TestPage, buttonText = "确定") {
  await page.getByRole("button", { name: buttonText }).click();
}

/**
 * 等待表格加载完成
 */
export async function waitForTableLoad(page: TestPage) {
  await expect(page.locator(".pure-table")).toBeVisible();
  // 等待 loading 消失
  await expect(page.locator(".el-loading-mask")).not.toBeVisible({
    timeout: 10000
  });
}

/**
 * 获取表格行数
 */
export async function getTableRowCount(page: TestPage): Promise<number> {
  const rows = page.locator(".pure-table tbody tr");
  return await rows.count();
}

/**
 * 搜索表格
 */
export async function searchTable(
  page: TestPage,
  searchValue: string,
  placeholder = "请输入"
) {
  await page.getByPlaceholder(placeholder).first().fill(searchValue);
  await page.getByRole("button", { name: /搜索|查询/ }).click();
  await waitForTableLoad(page);
}

/**
 * 重置搜索
 */
export async function resetSearch(page: TestPage) {
  await page.getByRole("button", { name: /重置/ }).click();
  await waitForTableLoad(page);
}

/**
 * 确认删除对话框
 */
export async function confirmDelete(page: TestPage) {
  await expect(page.locator(".el-message-box")).toBeVisible();
  await page.getByRole("button", { name: /确定删除/ }).click();
}

/**
 * 常用选择器
 */
export const selectors = {
  // 布局选择器
  sidebar: ".sidebar",
  header: ".navbar",
  mainContent: ".main-content",

  // 按钮选择器
  loginButton: 'button:has-text("登录")',
  logoutButton: 'button:has-text("退出")',
  addButton: 'button:has-text("新增")',
  editButton: 'button:has-text("修改")',
  deleteButton: 'button:has-text("删除")',
  viewButton: 'button:has-text("查看")',
  searchButton: 'button:has-text("搜索")',
  resetButton: 'button:has-text("重置")',

  // Element Plus 组件选择器
  dialog: ".el-dialog",
  table: ".pure-table",
  tableBody: ".pure-table tbody",
  pagination: ".el-pagination",
  message: ".el-message",
  messageSuccess: ".el-message--success",
  messageError: ".el-message--error",
  loading: ".el-loading-mask",
  formError: ".el-form-item__error",
  tag: ".el-tag"
};

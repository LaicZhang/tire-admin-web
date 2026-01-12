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
  await page.getByRole("button", { name: /确定|确认/ }).click();
}

/**
 * 保存单据
 */
export async function saveDocument(page: TestPage) {
  await page.getByRole("button", { name: /保存/ }).click();
  await page.waitForTimeout(500);
}

/**
 * 删除单据
 */
export async function deleteDocument(page: TestPage) {
  await page.getByRole("button", { name: /删除/ }).click();
  await confirmDelete(page);
}

/**
 * 复制单据
 */
export async function copyDocument(page: TestPage) {
  await page.getByRole("button", { name: /复制/ }).click();
  await page.waitForTimeout(500);
}

/**
 * 审核单据
 */
export async function approveDocument(page: TestPage) {
  const approveBtn = page.getByRole("button", { name: /审核/ });
  if (await approveBtn.isVisible()) {
    await approveBtn.click();
    await page.waitForTimeout(500);
  }
}

/**
 * 反审核单据
 */
export async function unapproveDocument(page: TestPage) {
  const unapproveBtn = page.getByRole("button", { name: /反审核/ });
  if (await unapproveBtn.isVisible()) {
    await unapproveBtn.click();
    await page.waitForTimeout(500);
  }
}

/**
 * 打印预览
 */
export async function openPrintPreview(page: TestPage) {
  const printBtn = page.getByRole("button", { name: /预览打印|打印/ });
  if (await printBtn.isVisible()) {
    await printBtn.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * 选择源单据
 */
export async function selectSourceDocument(page: TestPage) {
  const sourceBtn = page.getByRole("button", { name: /选择源单/ });
  if (await sourceBtn.isVisible()) {
    await sourceBtn.click();
    await waitForDialog(page);
  }
}

/**
 * 选择BOM表
 */
export async function selectBOM(page: TestPage) {
  const bomBtn = page.getByRole("button", { name: /选择BOM|从BOM表选择/ });
  if (await bomBtn.isVisible()) {
    await bomBtn.click();
    await waitForDialog(page);
  }
}

/**
 * 生成关联单据
 */
export async function generateRelatedDocument(page: TestPage, docType: string) {
  const genBtn = page.getByRole("button", {
    name: new RegExp(`生成${docType}`)
  });
  if (await genBtn.isVisible()) {
    await genBtn.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * 填写表单字段
 */
export async function fillFormField(
  page: TestPage,
  label: string,
  value: string
) {
  const field = page.getByLabel(label);
  if (await field.isVisible()) {
    await field.fill(value);
  }
}

/**
 * 选择下拉框选项
 */
export async function selectOption(
  page: TestPage,
  placeholder: string,
  optionIndex = 0
) {
  const select = page.getByPlaceholder(placeholder);
  if (await select.isVisible()) {
    await select.click();
    await page.waitForTimeout(300);
    const options = page.locator(".el-select-dropdown__item");
    const count = await options.count();
    if (count > optionIndex) {
      await options.nth(optionIndex).click();
    }
  }
}

/**
 * 验证保存成功消息
 */
export async function expectSaveSuccess(page: TestPage) {
  await expect(page.locator(selectors.messageSuccess)).toBeVisible({
    timeout: 5000
  });
}

/**
 * 验证操作失败消息
 */
export async function expectError(page: TestPage) {
  await expect(page.locator(selectors.messageError)).toBeVisible({
    timeout: 5000
  });
}

/**
 * 点击表格第一行操作按钮
 */
export async function clickFirstRowAction(page: TestPage, actionName: string) {
  const firstRow = page.locator(".pure-table tbody tr").first();
  const rowCount = await page.locator(".pure-table tbody tr").count();
  if (rowCount > 0) {
    await firstRow
      .getByRole("button", { name: new RegExp(actionName) })
      .click();
    await page.waitForTimeout(500);
  }
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
  saveButton: 'button:has-text("保存")',
  approveButton: 'button:has-text("审核")',
  printButton: 'button:has-text("打印")',
  copyButton: 'button:has-text("复制")',

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
  tag: ".el-tag",
  messageBox: ".el-message-box"
};

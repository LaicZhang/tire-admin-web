import { expect, type Locator, type Page } from "@playwright/test";

export async function expectSuccessMessage(page: Page, text: string) {
  const message = page
    .locator(".el-message--success")
    .filter({ hasText: text })
    .last();
  await expect(message).toBeVisible({ timeout: 10_000 });
}

export async function waitForPureTable(page: Page) {
  await expect(page.locator(".pure-table")).toBeVisible({ timeout: 30_000 });
  const loading = page.locator(".el-loading-mask");
  if (await loading.isVisible().catch(() => false)) {
    await expect(loading).not.toBeVisible({ timeout: 30_000 });
  }
}

export function tableRowByText(page: Page, text: string): Locator {
  return page.locator(".pure-table tbody tr").filter({ hasText: text }).first();
}

export async function confirmPopconfirm(page: Page, uniqueText: string) {
  const popover = page.locator(".el-popover").filter({ hasText: uniqueText });
  await expect(popover.first()).toBeVisible({ timeout: 10_000 });
  await popover.first().getByRole("button", { name: "确定" }).click();
}

export async function confirmMessageBox(page: Page, buttonText: string) {
  const box = page.locator(".el-message-box");
  await expect(box).toBeVisible({ timeout: 10_000 });
  await box.getByRole("button", { name: buttonText }).click();
  await expect(box).not.toBeVisible({ timeout: 10_000 });
}

export async function setPlusSearchSelect(
  page: Page,
  label: string,
  optionText: string
) {
  const item = page.locator(".el-form-item").filter({ hasText: label }).first();
  await expect(item).toBeVisible({ timeout: 10_000 });
  const select = item.locator(".el-select").first();
  await select.click();
  const option = page.locator(".el-select-dropdown__item").filter({
    hasText: optionText
  });
  await expect(option.first()).toBeVisible({ timeout: 10_000 });
  await option.first().click();
}

export async function clickSearch(page: Page) {
  const btn = page.getByRole("button", { name: /搜索|查询|Search/i }).first();
  await expect(btn).toBeVisible({ timeout: 10_000 });
  await btn.click();
}

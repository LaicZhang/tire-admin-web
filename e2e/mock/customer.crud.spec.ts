import { test, expect } from "@playwright/test";
import {
  waitForPureTable,
  tableRowByText,
  confirmPopconfirm,
  setPlusSearchSelect,
  clickSearch,
  expectSuccessMessage
} from "./helpers";

test.describe("客户管理（mock）", () => {
  test("新增 → 删除（软删）→ 已删除列表恢复", async ({ page }) => {
    const customerName = `E2E-客户-${Date.now()}`;

    await page.goto("/#/data/customer");
    await waitForPureTable(page);

    await page.getByRole("button", { name: "新增客户" }).click();

    const dialog = page.locator(".el-dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.locator(".el-dialog__title")).toContainText("新增客户");

    await dialog.getByPlaceholder("请输入客户名称").fill(customerName);
    await dialog.getByRole("button", { name: "确定" }).click();

    await expectSuccessMessage(page, "操作成功");
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText(customerName);

    const row = tableRowByText(page, customerName);
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.getByRole("button", { name: "删除" }).click();
    await confirmPopconfirm(page, customerName);

    await expectSuccessMessage(page, "删除成功");
    await waitForPureTable(page);

    await setPlusSearchSelect(page, "范围", "已删除");
    await clickSearch(page);
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText(customerName);

    const deletedRow = tableRowByText(page, customerName);
    await deletedRow.getByRole("button", { name: "恢复" }).click();
    await expectSuccessMessage(page, "恢复成功");

    await setPlusSearchSelect(page, "范围", "未删除");
    await clickSearch(page);
    await waitForPureTable(page);

    await expect(page.locator(".pure-table")).toContainText(customerName);
  });
});

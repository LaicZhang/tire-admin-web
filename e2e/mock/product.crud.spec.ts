import { test, expect } from "@playwright/test";
import {
  waitForPureTable,
  tableRowByText,
  confirmMessageBox,
  expectSuccessMessage
} from "./helpers";

test.describe("商品管理（mock）", () => {
  test("新增 → 修改 → 删除", async ({ page }) => {
    const productName = `E2E-商品-${Date.now()}`;
    const updatedGroup = `E2E分组-${Date.now()}`;

    await page.goto("/#/data/product");
    await waitForPureTable(page);

    await page.getByRole("button", { name: "新增商品" }).click();

    const dialog = page.locator(".el-dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.locator(".el-dialog__title")).toContainText("新增商品");

    await dialog.getByPlaceholder("请输入商品名称").fill(productName);
    await dialog.getByPlaceholder("售价").fill("123.45");
    await dialog.getByRole("button", { name: "确定" }).click();

    await expectSuccessMessage(page, "操作成功");
    await waitForPureTable(page);

    const row = tableRowByText(page, productName);
    await expect(row).toBeVisible({ timeout: 10_000 });

    await row.getByRole("button", { name: "修改" }).click();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.locator(".el-dialog__title")).toContainText("修改商品");

    const groupItem = dialog
      .locator(".el-form-item")
      .filter({ hasText: "分组" })
      .first();
    const groupSelect = groupItem.locator(".el-select").first();
    await expect(groupSelect).toBeVisible({ timeout: 10_000 });
    const clear = groupSelect.locator(".el-icon-circle-close");
    await groupSelect.hover();
    if (await clear.isVisible().catch(() => false)) {
      await clear.click();
    }
    await groupSelect.click();
    await page.keyboard.type(updatedGroup);
    await page.keyboard.press("Enter");
    await expect(groupSelect).toContainText(updatedGroup);

    await dialog.getByPlaceholder("售价").fill("234.56");
    await dialog.getByRole("button", { name: "确定" }).click();

    await expectSuccessMessage(page, "操作成功");
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText(updatedGroup);

    const updatedRow = tableRowByText(page, productName);
    await updatedRow.getByRole("button", { name: "删除" }).click();
    await confirmMessageBox(page, "确定删除");

    await expectSuccessMessage(page, "删除成功");
    await waitForPureTable(page);

    await expect(
      page.locator(".pure-table tbody tr").filter({ hasText: productName })
    ).toHaveCount(0);
  });
});

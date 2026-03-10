import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  confirmMessageBox,
  expectSuccessMessage,
  tableRowByText,
  waitForPureTable
} from "./helpers";

const API_ORIGIN = `http://127.0.0.1:${process.env.E2E_API_PORT || "19000"}`;

async function waitForDialog(page: Page, title: string) {
  const dialog = page.locator(".el-dialog").filter({ hasText: title }).last();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

async function chooseOption(
  page: Page,
  scope: Locator,
  label: string,
  optionText: string
) {
  const item = scope
    .locator(".el-form-item")
    .filter({ hasText: label })
    .first();
  await expect(item).toBeVisible({ timeout: 10_000 });
  await item.locator(".el-select").first().click();
  const option = page
    .locator(".el-select-dropdown:visible .el-select-dropdown__item")
    .filter({ hasText: optionText })
    .first();
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click({ force: true });
}

async function fillNumber(scope: Locator, label: string, value: string) {
  const item = scope
    .locator(".el-form-item")
    .filter({ hasText: label })
    .first();
  await expect(item).toBeVisible({ timeout: 10_000 });
  const input = item.locator("input").first();
  await input.click();
  await input.fill(value);
  await input.press("Tab");
}

async function submitDialog(
  scope: Locator,
  buttonText: RegExp | string = "确定"
) {
  const button =
    typeof buttonText === "string"
      ? scope.getByRole("button", { name: buttonText })
      : scope.getByRole("button", { name: buttonText });
  await button.click();
}

test.describe("fund mock 接口覆盖", () => {
  test("预收款页覆盖列表/新建/核销/删除接口", async ({ page }) => {
    const listResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/finance/advance-payment?")
    );
    await page.goto("/#/fund/receipt");
    await listResponse;
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText("YSK-20260309-001");

    const createResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/finance/advance-payment") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "新建" }).click();
    const createDialog = await waitForDialog(page, "新建预收款");
    await chooseOption(page, createDialog, "客户", "存量客户");
    await fillNumber(createDialog, "金额(元)", "123");
    await submitDialog(createDialog);
    const createResult = await (await createResponse).json();
    const createdBillNo = String(
      (createResult as { data?: { billNo?: string } }).data?.billNo || ""
    );
    await expectSuccessMessage(page, "新建成功");

    const writeOffApiResponse = await page.request.post(
      `${API_ORIGIN}/api/v1/finance/advance-payment/write-off`,
      {
        data: {
          advanceId: 1,
          orderUid: "sale-order-1",
          amount: 5000
        }
      }
    );
    expect(writeOffApiResponse.ok()).toBeTruthy();

    const deleteResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/finance/advance-payment/") &&
        response.request().method() === "DELETE"
    );
    await tableRowByText(page, createdBillNo)
      .getByRole("button", { name: "删除" })
      .click();
    await confirmMessageBox(page, "确定");
    await deleteResponse;
    await expectSuccessMessage(page, "删除成功");
  });

  test("付款单页覆盖列表/新建/审核/删除接口", async ({ page }) => {
    const listResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/payment-order/1")
    );
    await page.goto("/#/fund/payment");
    await listResponse;
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText("FKD-20260309-001");

    const createResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/payment-order") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "新建付款单" }).click();
    const createDialog = await waitForDialog(page, "新建付款单");
    await chooseOption(page, createDialog, "供应商", "示例供应商");
    await chooseOption(page, createDialog, "结算账户", "工商银行");
    await fillNumber(createDialog, "付款金额", "200");
    await submitDialog(createDialog);
    const createResult = await (await createResponse).json();
    const createdBillNo = String(
      (createResult as { data?: { billNo?: string } }).data?.billNo || ""
    );
    await expectSuccessMessage(page, "创建成功");

    const approveResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/payment-order/payment-order-1/approve")
    );
    await tableRowByText(page, "FKD-20260309-001")
      .getByRole("button", { name: "审核" })
      .click();
    await confirmMessageBox(page, "确定");
    await approveResponse;
    await expectSuccessMessage(page, "审核成功");

    const deleteResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/payment-order/") &&
        response.request().method() === "DELETE"
    );
    await tableRowByText(page, createdBillNo)
      .getByRole("button", { name: "删除" })
      .click();
    await confirmMessageBox(page, "确定");
    await deleteResponse;
    await expectSuccessMessage(page, "删除成功");
  });

  test("其他收入和其他支出页覆盖主流程与二级收付款接口", async ({ page }) => {
    const incomeListResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/other-income-order/1")
    );
    await page.goto("/#/fund/otherIncome");
    await incomeListResponse;
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText(
      "QTSR-20260309-001"
    );

    const incomeCreateResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/other-income-order") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "新增收入单" }).click();
    const incomeDialog = await waitForDialog(page, "新建其他收入单");
    await fillNumber(incomeDialog, "金额", "180");
    await submitDialog(incomeDialog);
    const incomeCreateResult = await (await incomeCreateResponse).json();
    const createdIncomeBillNo = String(
      (incomeCreateResult as { data?: { billNo?: string } }).data?.billNo || ""
    );
    await expectSuccessMessage(page, "创建成功");

    const receiveResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/finance/advance-payment") &&
        response.request().method() === "POST"
    );
    await tableRowByText(page, "QTSR-20260309-001")
      .getByRole("button", { name: "收款" })
      .click();
    const receiveDialog = await waitForDialog(page, "登记收款");
    await submitDialog(receiveDialog);
    await receiveResponse;
    await expectSuccessMessage(page, "新建成功");

    const incomeDeleteResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/other-income-order/") &&
        response.request().method() === "DELETE"
    );
    await tableRowByText(page, createdIncomeBillNo)
      .getByRole("button", { name: "删除" })
      .click();
    await confirmMessageBox(page, "确定");
    await incomeDeleteResponse;
    await expectSuccessMessage(page, "删除成功");

    const expenseListResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/expense-order/1")
    );
    await page.goto("/#/fund/otherExpense");
    await expenseListResponse;
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText(
      "QTZC-20260309-001"
    );

    const expenseCreateResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/expense-order") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "新增支出单" }).click();
    const expenseDialog = await waitForDialog(page, "新建其他支出单");
    await fillNumber(expenseDialog, "金额", "210");
    await submitDialog(expenseDialog);
    const expenseCreateResult = await (await expenseCreateResponse).json();
    const createdExpenseBillNo = String(
      (expenseCreateResult as { data?: { billNo?: string } }).data?.billNo || ""
    );
    await expectSuccessMessage(page, "创建成功");

    const payResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/payment-order") &&
        response.request().method() === "POST"
    );
    await tableRowByText(page, "QTZC-20260309-001")
      .getByRole("button", { name: "付款" })
      .click();
    const payDialog = await waitForDialog(page, "登记付款");
    await chooseOption(page, payDialog, "结算账户", "工商银行");
    await submitDialog(payDialog);
    await payResponse;
    await expectSuccessMessage(page, "创建成功");

    const expenseDeleteResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/expense-order/") &&
        response.request().method() === "DELETE"
    );
    await tableRowByText(page, createdExpenseBillNo)
      .getByRole("button", { name: "删除" })
      .click();
    await confirmMessageBox(page, "确定");
    await expenseDeleteResponse;
    await expectSuccessMessage(page, "删除成功");
  });

  test("转账单和核销单页覆盖列表/新建/审核/删除接口", async ({ page }) => {
    const transferListResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/finance-extension/account-transfer/1")
    );
    await page.goto("/#/fund/transfer");
    await transferListResponse;
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText("ZZD-20260309-001");

    const transferCreateResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/finance-extension/account-transfer") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "新建转账单" }).click();
    const transferDialog = await waitForDialog(page, "新建转账单");
    await transferDialog.getByRole("combobox", { name: "* 转出账户" }).click();
    await page.getByRole("option", { name: /工商银行/ }).click();
    await transferDialog.getByRole("combobox", { name: "* 转入账户" }).click();
    await page.getByRole("option", { name: /^建设银行$/ }).click();
    await fillNumber(transferDialog, "转账金额", "80");
    await submitDialog(transferDialog, "确认转账");
    const transferCreateResult = await (await transferCreateResponse).json();
    const createdTransferBillNo = String(
      (transferCreateResult as { data?: { billNo?: string } }).data?.billNo ||
        ""
    );
    await expectSuccessMessage(page, "创建成功");

    const transferApproveResponse = page.waitForResponse(response =>
      response
        .url()
        .includes(
          "/api/v1/finance-extension/account-transfer/transfer-1/approve"
        )
    );
    await tableRowByText(page, "ZZD-20260309-001")
      .getByRole("button", { name: "审核" })
      .click();
    await confirmMessageBox(page, "确定");
    await transferApproveResponse;
    await expectSuccessMessage(page, "审核成功");

    const transferDeleteResponse = page.waitForResponse(
      response =>
        response
          .url()
          .includes("/api/v1/finance-extension/account-transfer/") &&
        response.request().method() === "DELETE"
    );
    await tableRowByText(page, createdTransferBillNo)
      .getByRole("button", { name: "删除" })
      .click();
    await confirmMessageBox(page, "确定");
    await transferDeleteResponse;
    await expectSuccessMessage(page, "删除成功");

    const writeOffListResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/write-off-order/page/1")
    );
    await page.goto("/#/fund/writeOff");
    await writeOffListResponse;
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText("WO-20260309-001");

    const writeOffCreateResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/write-off-order") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "新建核销单" }).click();
    const writeOffDialog = await waitForDialog(page, "新建核销单");
    await chooseOption(page, writeOffDialog, "客户", "存量客户");
    await fillNumber(writeOffDialog, "应收金额", "150");
    await fillNumber(writeOffDialog, "核销金额", "100");
    await submitDialog(writeOffDialog);
    const writeOffCreateResult = await (await writeOffCreateResponse).json();
    const createdWriteOffBillNo = String(
      (writeOffCreateResult as { data?: { billNo?: string } }).data?.billNo ||
        ""
    );
    await expectSuccessMessage(page, "创建成功");

    const writeOffApproveResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/write-off-order/writeoff-1/approve")
    );
    await tableRowByText(page, "WO-20260309-001")
      .getByRole("button", { name: "审核" })
      .click();
    await confirmMessageBox(page, "确定");
    await writeOffApproveResponse;
    await expectSuccessMessage(page, "审核成功");

    const writeOffDeleteResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/write-off-order/") &&
        response.request().method() === "DELETE"
    );
    await tableRowByText(page, createdWriteOffBillNo)
      .getByRole("button", { name: "删除" })
      .click();
    await confirmMessageBox(page, "确定");
    await writeOffDeleteResponse;
    await expectSuccessMessage(page, "删除成功");
  });
});

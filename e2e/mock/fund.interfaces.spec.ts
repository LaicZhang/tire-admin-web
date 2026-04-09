import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  confirmMessageBox,
  expectSuccessMessage,
  tableRowByText,
  waitForPureTable
} from "./helpers";

const UI_TIMEOUT_MS = 10_000;
const FLOW_TIMEOUT_MS = 90_000;

async function waitForDialog(page: Page, title: string) {
  const dialog = page.locator(".el-dialog").filter({ hasText: title }).last();
  await expect(dialog).toBeVisible({ timeout: UI_TIMEOUT_MS });
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
  await expect(item).toBeVisible({ timeout: UI_TIMEOUT_MS });
  await item
    .locator(".el-select__wrapper, .el-select")
    .first()
    .click({ force: true });
  const option = page
    .locator(".el-select-dropdown:visible")
    .last()
    .locator(".el-select-dropdown__item")
    .filter({ hasText: optionText })
    .first();
  await expect(option).toBeVisible({ timeout: UI_TIMEOUT_MS });
  await option.click({ force: true });
}

async function fillNumber(scope: Locator, label: string, value: string) {
  const item = scope
    .locator(".el-form-item")
    .filter({ hasText: label })
    .first();
  await expect(item).toBeVisible({ timeout: UI_TIMEOUT_MS });
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
  await button.click({ force: true });
}

async function expectFormError(scope: Locator, text: string) {
  await expect(
    scope.locator(".el-form-item__error").filter({ hasText: text }).first()
  ).toBeVisible({ timeout: UI_TIMEOUT_MS });
}

async function closeDialog(scope: Locator) {
  await scope.getByRole("button", { name: "取消" }).click({ force: true });
  await expect(scope).not.toBeVisible({ timeout: UI_TIMEOUT_MS });
}

async function expectRowVisible(page: Page, text: string) {
  await expect(tableRowByText(page, text)).toBeVisible({
    timeout: UI_TIMEOUT_MS
  });
}

async function expectRowGone(page: Page, text: string) {
  await expect(
    page.locator(".pure-table tbody tr").filter({ hasText: text })
  ).toHaveCount(0, { timeout: UI_TIMEOUT_MS });
}

async function expectRowContains(page: Page, text: string, expected: string) {
  await expect(tableRowByText(page, text)).toContainText(expected, {
    timeout: UI_TIMEOUT_MS
  });
}

async function chooseComboboxOption(
  page: Page,
  scope: Locator,
  label: string,
  keyword: string
) {
  const combobox = scope.getByRole("combobox", {
    name: new RegExp(label)
  });
  await expect(combobox).toBeVisible({ timeout: UI_TIMEOUT_MS });
  await combobox.click({ force: true });
  await combobox.fill(keyword);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
}

async function coverOtherIncomeAndExpenseFlow(page: Page) {
  await coverOtherIncomeFlow(page);
  await coverOtherExpenseFlow(page);
}

async function coverOtherIncomeFlow(page: Page) {
  const incomeListResponse = page.waitForResponse(response =>
    response.url().includes("/api/v1/other-income-order/1")
  );
  await page.goto("/#/fund/otherIncome");
  await incomeListResponse;
  await waitForPureTable(page);
  await expect(page.locator(".pure-table")).toContainText("QTSR-20260309-001");

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
      response.url().includes("/api/v1/receipt-order") &&
      response.request().method() === "POST"
  );
  await tableRowByText(page, "QTSR-20260309-001")
    .getByRole("button", { name: "收款" })
    .click();
  const receiveDialog = await waitForDialog(page, "登记收款");
  await chooseOption(page, receiveDialog, "结算账户", "工商银行");
  await submitDialog(receiveDialog);
  await receiveResponse;
  await expectSuccessMessage(page, "创建成功");

  const incomeDeleteResponse = page.waitForResponse(
    response =>
      response.url().includes(`/api/v1/other-income-order/`) &&
      response.request().method() === "DELETE"
  );
  await tableRowByText(page, createdIncomeBillNo)
    .getByRole("button", { name: "删除" })
    .click();
  await confirmMessageBox(page, "确定");
  await incomeDeleteResponse;
  await expectRowGone(page, createdIncomeBillNo);
}

async function coverOtherExpenseFlow(page: Page) {
  const expenseListResponse = page.waitForResponse(response =>
    response.url().includes("/api/v1/other-expense-order/1")
  );
  await page.goto("/#/fund/otherExpense");
  await expenseListResponse;
  await waitForPureTable(page);
  await expect(page.locator(".pure-table")).toContainText("QTZC-20260309-001");

  const expenseCreateResponse = page.waitForResponse(
    response =>
      response.url().includes("/api/v1/other-expense-order") &&
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
  await expectRowVisible(page, createdExpenseBillNo);

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
      response.url().includes("/api/v1/other-expense-order/") &&
      response.request().method() === "DELETE"
  );
  await tableRowByText(page, createdExpenseBillNo)
    .getByRole("button", { name: "删除" })
    .click();
  await confirmMessageBox(page, "确定");
  await expenseDeleteResponse;
  await expectRowGone(page, createdExpenseBillNo);
}

async function coverTransferAndWriteOffInterfaces(page: Page) {
  await coverTransferInterfaces(page);
  await coverWriteOffInterfaces(page);
}

async function coverTransferInterfaces(page: Page) {
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
  await chooseComboboxOption(page, transferDialog, "转出账户", "工商银行");
  await chooseComboboxOption(page, transferDialog, "转入账户", "建设银行");
  await fillNumber(transferDialog, "转账金额", "80");
  await submitDialog(transferDialog, "确认转账");
  const transferCreateResult = await (await transferCreateResponse).json();
  const createdTransferBillNo = String(
    (transferCreateResult as { data?: { billNo?: string } }).data?.billNo || ""
  );
  await expectRowVisible(page, createdTransferBillNo);

  const transferApproveResponse = page.waitForResponse(response =>
    response
      .url()
      .includes("/api/v1/finance-extension/account-transfer/transfer-1/approve")
  );
  await tableRowByText(page, "ZZD-20260309-001")
    .getByRole("button", { name: "审核" })
    .click();
  await confirmMessageBox(page, "确定");
  await transferApproveResponse;
  await expectSuccessMessage(page, "审核成功");

  const transferDeleteResponse = page.waitForResponse(
    response =>
      response.url().includes("/api/v1/finance-extension/account-transfer/") &&
      response.request().method() === "DELETE"
  );
  await tableRowByText(page, createdTransferBillNo)
    .getByRole("button", { name: "删除" })
    .click();
  await confirmMessageBox(page, "确定");
  await transferDeleteResponse;
  await expectRowGone(page, createdTransferBillNo);
}

async function coverWriteOffInterfaces(page: Page) {
  const writeOffListResponse = page.waitForResponse(response =>
    response.url().includes("/api/v1/write-off-order/page/1")
  );
  await page.goto("/#/fund/writeOff");
  await writeOffListResponse;
  await waitForPureTable(page);
  await expect(page.locator(".pure-table")).toContainText("WO-20260309-001");

  const first = await createWriteOff(page, {
    receivableAmount: "150",
    writeOffAmount: "100"
  });
  await deleteWriteOff(page, first);

  const second = await createWriteOff(page, {
    receivableAmount: "160",
    writeOffAmount: "110"
  });
  await approveWriteOff(page, second);
  await expect(tableRowByText(page, second.billNo)).toContainText("已审核");
}

async function createWriteOff(
  page: Page,
  amounts: { receivableAmount: string; writeOffAmount: string }
) {
  const writeOffCreateResponse = page.waitForResponse(
    response =>
      response.url().includes("/api/v1/write-off-order") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "新建核销单" }).click();
  const writeOffDialog = await waitForDialog(page, "新建核销单");
  await chooseOption(page, writeOffDialog, "客户", "存量客户");
  await fillNumber(writeOffDialog, "应收金额", amounts.receivableAmount);
  await fillNumber(writeOffDialog, "核销金额", amounts.writeOffAmount);
  await submitDialog(writeOffDialog);
  const writeOffCreateResult = await (await writeOffCreateResponse).json();
  const uid = String(
    (writeOffCreateResult as { data?: { uid?: string } }).data?.uid || ""
  );
  const billNo = String(
    (writeOffCreateResult as { data?: { billNo?: string } }).data?.billNo || ""
  );
  await expectRowVisible(page, billNo);
  return { uid, billNo };
}

async function approveWriteOff(
  page: Page,
  record: { uid: string; billNo: string }
) {
  const writeOffApproveResponse = page.waitForResponse(response =>
    response.url().includes(`/api/v1/write-off-order/${record.uid}/approve`)
  );
  await tableRowByText(page, record.billNo)
    .getByRole("button", { name: "审核" })
    .click();
  await confirmMessageBox(page, "确定");
  await writeOffApproveResponse;
}

async function deleteWriteOff(
  page: Page,
  record: { uid: string; billNo: string }
) {
  const writeOffDeleteResponse = page.waitForResponse(
    response =>
      response.url().includes(`/api/v1/write-off-order/${record.uid}`) &&
      response.request().method() === "DELETE"
  );
  await tableRowByText(page, record.billNo)
    .getByRole("button", { name: "删除" })
    .click();
  await confirmMessageBox(page, "确定");
  await writeOffDeleteResponse;
  await expectRowGone(page, record.billNo);
}

test.describe("fund mock 接口覆盖", () => {
  test("收款单/付款单/转账单表单会阻止空提交并显示关键校验", async ({
    page
  }) => {
    await page.goto("/#/fund/receipt");
    await waitForPureTable(page);
    await page.getByRole("button", { name: "新建收款单" }).click();
    const receiptDialog = await waitForDialog(page, "新建收款单");
    await submitDialog(receiptDialog);
    await expectFormError(receiptDialog, "请选择客户");
    await expectFormError(receiptDialog, "收款金额必须大于0");
    await closeDialog(receiptDialog);

    await page.goto("/#/fund/payment");
    await waitForPureTable(page);
    await page.getByRole("button", { name: "新建付款单" }).click();
    const paymentDialog = await waitForDialog(page, "新建付款单");
    await submitDialog(paymentDialog);
    await expectFormError(paymentDialog, "请选择供应商");
    await expectFormError(paymentDialog, "付款金额必须大于0");
    await closeDialog(paymentDialog);

    await page.goto("/#/fund/transfer");
    await waitForPureTable(page);
    await page.getByRole("button", { name: "新建转账单" }).click();
    const transferDialog = await waitForDialog(page, "新建转账单");
    await submitDialog(transferDialog, "确认转账");
    await expectFormError(transferDialog, "请选择转出账户");
    await expectFormError(transferDialog, "请选择转入账户");
    await expectFormError(transferDialog, "转账金额必须大于0");
  });

  test("收款单/付款单在必填已选后仍会拦截 0 金额提交", async ({ page }) => {
    await page.goto("/#/fund/receipt");
    await waitForPureTable(page);
    await page.getByRole("button", { name: "新建收款单" }).click();
    const receiptDialog = await waitForDialog(page, "新建收款单");
    await chooseOption(page, receiptDialog, "客户", "存量客户");
    await chooseOption(page, receiptDialog, "结算账户", "工商银行");
    await fillNumber(receiptDialog, "收款金额", "0");
    await submitDialog(receiptDialog);
    await expectFormError(receiptDialog, "收款金额必须大于0");
    await closeDialog(receiptDialog);

    await page.goto("/#/fund/payment");
    await expect(page.getByRole("button", { name: "新建付款单" })).toBeVisible({
      timeout: UI_TIMEOUT_MS
    });
    await page.getByRole("button", { name: "新建付款单" }).click();
    const paymentDialog = await waitForDialog(page, "新建付款单");
    await chooseOption(page, paymentDialog, "供应商", "示例供应商");
    await chooseOption(page, paymentDialog, "结算账户", "工商银行");
    await fillNumber(paymentDialog, "付款金额", "0");
    await submitDialog(paymentDialog);
    await expectFormError(paymentDialog, "付款金额必须大于0");
  });

  test("收款单页覆盖列表/新建/审核/删除接口", async ({ page }) => {
    const listResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/receipt-order/1")
    );
    await page.goto("/#/fund/receipt");
    await listResponse;
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText("SKD-20260309-001");

    const createResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/receipt-order") &&
        response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "新建收款单" }).click();
    const createDialog = await waitForDialog(page, "新建收款单");
    await chooseOption(page, createDialog, "客户", "存量客户");
    await chooseOption(page, createDialog, "结算账户", "工商银行");
    await fillNumber(createDialog, "收款金额", "123");
    await submitDialog(createDialog);
    const createResult = await (await createResponse).json();
    const createdBillNo = String(
      (createResult as { data?: { billNo?: string } }).data?.billNo || ""
    );
    await expectRowVisible(page, createdBillNo);

    const approveResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/receipt-order/receipt-order-1/approve")
    );
    await tableRowByText(page, "SKD-20260309-001")
      .getByRole("button", { name: "审核" })
      .click();
    await confirmMessageBox(page, "确定");
    await approveResponse;
    await expectRowContains(page, "SKD-20260309-001", "已审核");

    const deleteResponse = page.waitForResponse(
      response =>
        response.url().includes("/api/v1/receipt-order/") &&
        response.request().method() === "DELETE"
    );
    await tableRowByText(page, createdBillNo)
      .getByRole("button", { name: "删除" })
      .click();
    await confirmMessageBox(page, "确定");
    await deleteResponse;
    await expectRowGone(page, createdBillNo);
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
    await expectRowVisible(page, createdBillNo);

    const approveResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/payment-order/payment-order-1/approve")
    );
    await tableRowByText(page, "FKD-20260309-001")
      .getByRole("button", { name: "审核" })
      .click();
    await confirmMessageBox(page, "确定");
    await approveResponse;
    await expectRowContains(page, "FKD-20260309-001", "已审核");

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
    await expectRowGone(page, createdBillNo);
  });

  test("其他收入和其他支出页覆盖主流程与二级收付款接口", async ({ page }) => {
    test.setTimeout(FLOW_TIMEOUT_MS);
    await coverOtherIncomeAndExpenseFlow(page);
  });

  test("转账单和核销单页覆盖列表/新建/审核/删除接口", async ({ page }) => {
    test.setTimeout(FLOW_TIMEOUT_MS);
    await coverTransferAndWriteOffInterfaces(page);
  });
});

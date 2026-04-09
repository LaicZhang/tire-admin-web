import { expect, test } from "@playwright/test";
import {
  confirmMessageBox,
  expectSuccessMessage,
  tableRowByText,
  waitForPureTable
} from "./helpers";

const API_ORIGIN = `http://127.0.0.1:${process.env.E2E_API_PORT || "19000"}`;

async function switchMockCompany(
  request: import("@playwright/test").APIRequestContext,
  companyId: string
) {
  const response = await request.post(
    `${API_ORIGIN}/api/v1/auth/current-company`,
    {
      data: { companyId }
    }
  );
  expect(response.ok()).toBeTruthy();
}

async function stubWindowOpen(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.open = () =>
      ({
        document: {
          write() {},
          close() {}
        },
        focus() {},
        print() {}
      }) as Window;
  });
}

test.describe("审计回归（后端确认项）", () => {
  test("CSV:27/58 登录态依赖服务端 session 校验", async ({ page }) => {
    await page.route("**/api/v1/auth/session", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "ok",
          data: {
            authenticated: false
          }
        })
      });
    });

    await page.goto("/#/data/customer");
    await expect(page).toHaveURL(/#\/login$/);
  });

  test("CSV:12/45 导入导出页支持新增类型、模板下载、导入和动态导出字段", async ({
    page
  }) => {
    await page.goto("/#/data/importExport");
    await expect(page.getByRole("tab", { name: "数据导入" })).toBeVisible();

    const importModule = page
      .locator(".el-form-item")
      .filter({ hasText: "导入模块" })
      .locator(".el-select")
      .first();
    await importModule.click();
    for (const label of ["仓库", "员工", "客户期初余额", "供应商期初余额"]) {
      await expect(
        page
          .locator(".el-select-dropdown:visible .el-select-dropdown__item")
          .filter({ hasText: label })
          .first()
      ).toBeVisible();
    }
    await page
      .locator(".el-select-dropdown:visible .el-select-dropdown__item")
      .filter({ hasText: "仓库" })
      .first()
      .click();

    const templateResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/tools/import/template/repo/download")
    );
    await page.getByRole("button", { name: "下载模板" }).click();
    await templateResponse;
    await expectSuccessMessage(page, "下载成功");

    await page.locator('input[type="file"]').setInputFiles({
      name: "repo.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from("repo")
    });
    await expect(page.locator(".el-message").last()).toContainText("导入成功");

    await page.getByRole("tab", { name: "数据导出" }).click();
    const exportModule = page
      .locator(".el-form-item")
      .filter({ hasText: "导出模块" })
      .locator(".el-select")
      .first();
    await exportModule.click();
    await page
      .locator(".el-select-dropdown:visible .el-select-dropdown__item")
      .filter({ hasText: "客户期初余额" })
      .first()
      .click();

    await expect(page.getByText("名称")).toBeVisible();
    await expect(page.getByText("编码")).toBeVisible();

    const exportResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/tools/export/customer-balance")
    );
    await page.getByRole("button", { name: "导出数据" }).click();
    await exportResponse;
    await expectSuccessMessage(page, "下载成功");

    await page.getByRole("tab", { name: "任务历史" }).click();
    await expect(page.locator(".pure-table")).toContainText("customerBalance");
  });

  test("CSV:15 支付账户分页透传 pageSize", async ({ page }) => {
    const pageResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/payment/page/1?pageSize=10")
    );

    await page.goto("/#/business/payment");
    await pageResponse;
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText("payment-1");
  });

  test("CSV:18 核销单列表走分页接口并使用真实 uid 审核", async ({ page }) => {
    const pageResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/write-off-order/page/1?pageSize=20")
    );

    await page.goto("/#/fund/writeOff");
    await pageResponse;
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText("WO-20260309-001");

    const approveResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/write-off-order/writeoff-1/approve")
    );
    await tableRowByText(page, "WO-20260309-001")
      .getByRole("button", { name: "审核" })
      .click();
    await confirmMessageBox(page, "确定");
    await approveResponse;
    await expectSuccessMessage(page, "审核成功");
  });

  test("CSV:41 备份下载走后端 Blob 下载接口", async ({ page }) => {
    await page.goto("/#/settings/backup");
    await waitForPureTable(page);

    const downloadResponse = page.waitForResponse(response =>
      response.url().includes("/api/v1/backup/backup-1/download")
    );
    await tableRowByText(page, "backup-20260309.zip")
      .getByRole("button", { name: "下载" })
      .click();
    const response = await downloadResponse;

    expect(response.headers()["content-type"]).toContain("application/zip");
    await expectSuccessMessage(page, "下载成功");
  });

  test("CSV:42 客户表单读取期初余额摘要且新增不提交 initialBalance", async ({
    page
  }) => {
    await page.goto("/#/business/customer");
    await waitForPureTable(page);

    await tableRowByText(page, "存量客户")
      .getByRole("button", { name: "查看" })
      .click();
    const dialog = page.locator(".el-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("当前期初净额：900");
    await expect(
      dialog.getByRole("spinbutton", { name: "期初欠款" })
    ).toBeDisabled();
    await dialog.locator(".el-dialog__headerbtn").click();

    await page.getByRole("button", { name: "新增客户" }).click();
    const createDialog = page.locator(".el-dialog").last();
    await createDialog
      .getByPlaceholder("请输入客户名称")
      .fill(`审计客户-${Date.now()}`);
    await createDialog.getByRole("button", { name: "确定" }).click();
    await expect(page.locator(".el-message--success")).toContainText(
      "您新增了客户"
    );
  });

  test("CSV:13 导出弹窗通过页级场景透传 ids + filter + fields 到同步与异步导出", async ({
    page
  }) => {
    await page.goto("/#/audit/export-dialog");

    await page.getByTestId("open-export-dialog").click();
    await expect(page.locator(".el-dialog")).toContainText("选中数量");
    await expect(page.locator(".el-dialog")).toContainText("2 条");

    const syncRequestPromise = page.waitForRequest(request =>
      request.url().includes("/api/v1/tools/export/customer")
    );
    await page.getByRole("button", { name: "开始导出" }).click();
    const syncRequest = await syncRequestPromise;
    const decodedSyncUrl = decodeURIComponent(syncRequest.url());
    expect(decodedSyncUrl).toContain(
      'filter={"keyword":"审计关键字","scope":"nonDeleted","status":"active"}'
    );
    expect(decodedSyncUrl).toContain("ids[0]=c1");
    expect(decodedSyncUrl).toContain("ids[1]=c2");
    expect(decodedSyncUrl).toContain("fields[0]=name");
    expect(decodedSyncUrl).toContain("fields[1]=code");
    await expectSuccessMessage(page, "下载成功");

    await page.getByTestId("open-export-dialog").click();
    await page.getByText("异步导出").click();
    const asyncRequestPromise = page.waitForRequest(request =>
      request.url().includes("/api/v1/tools/export/async/customer")
    );
    await page.getByRole("button", { name: "开始导出" }).click();
    const asyncRequest = await asyncRequestPromise;
    const decodedAsyncUrl = decodeURIComponent(asyncRequest.url());
    expect(decodedAsyncUrl).toContain(
      'filter={"keyword":"审计关键字","scope":"nonDeleted","status":"active"}'
    );
    expect(decodedAsyncUrl).toContain("ids[0]=c1");
    expect(decodedAsyncUrl).toContain("ids[1]=c2");
    expect(decodedAsyncUrl).toContain("fields[0]=name");
    expect(decodedAsyncUrl).toContain("fields[1]=code");
    await expectSuccessMessage(page, "下载成功");
  });

  test("CSV:14/25 权限审计页同时验证按钮鉴权与菜单过滤仅读取用户态", async ({
    page
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "user-info",
        JSON.stringify({
          expires: Date.now() + 86400000,
          username: "auditor",
          roles: ["auditor"],
          permissions: ["audit:export"],
          uid: "audit-user"
        })
      );
    });

    await page.goto("/#/audit/permission");

    await expect(page.getByTestId("auth-export-button")).toBeVisible();
    await expect(page.getByTestId("auth-delete-button")).toHaveCount(0);
    await expect(page.getByTestId("store-roles")).toHaveText("auditor");
    await expect(page.getByTestId("menu-preview")).toContainText("审计员菜单");
    await expect(page.getByTestId("menu-preview")).not.toContainText(
      "管理员菜单"
    );

    await page.evaluate(() => {
      localStorage.setItem(
        "user-info",
        JSON.stringify({
          expires: Date.now() + 86400000,
          username: "forged-admin",
          roles: ["admin"],
          permissions: ["audit:export", "audit:delete"],
          uid: "forged-admin"
        })
      );
    });
    await page.getByTestId("refresh-permission-preview").click();

    await expect(page.getByTestId("local-storage-roles")).toHaveText("admin");
    await expect(page.getByTestId("store-roles")).toHaveText("auditor");
    await expect(page.getByTestId("menu-preview")).toContainText("审计员菜单");
    await expect(page.getByTestId("menu-preview")).not.toContainText(
      "管理员菜单"
    );
  });

  test("CSV:16/17 客户商品编码页走后端持久化并按公司上下文隔离", async ({
    page
  }) => {
    const auditCode = `AUDIT-CPC-${Date.now()}`;
    await switchMockCompany(page.request, "company-1");

    await page.goto("/#/data/customerProductCode");
    await waitForPureTable(page);

    await page.getByRole("button", { name: "新增" }).click();
    const dialog = page
      .locator(".el-dialog")
      .filter({ hasText: "新增客户商品编码" })
      .last();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await dialog.getByRole("combobox", { name: /客户/ }).click({ force: true });
    await page
      .locator(".el-select-dropdown:visible")
      .getByRole("option", { name: "客户A" })
      .click();
    const tireCombobox = dialog.getByRole("combobox", { name: /商品/ });
    await tireCombobox.focus();
    await tireCombobox.press("ArrowDown");
    await page
      .locator(".el-select-dropdown:visible")
      .getByRole("option", { name: "轮胎A" })
      .click();
    await dialog.getByPlaceholder("请输入客户商品编码").fill(auditCode);
    await dialog
      .getByPlaceholder("请输入客户商品名称")
      .fill("审计客户商品编码");
    await dialog.getByRole("button", { name: "确定" }).click();
    await expectSuccessMessage(page, "新增成功");
    await expect(page.locator(".pure-table")).toContainText(auditCode);

    await page.reload();
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText(auditCode);

    await switchMockCompany(page.request, "company-2");
    await page.reload();
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).not.toContainText(auditCode);

    await switchMockCompany(page.request, "company-1");
    await page.reload();
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText(auditCode);
  });

  test("CSV:24 菜单 iframe 在菜单页校验非法地址，并在 FrameView 放行同源白名单地址", async ({
    page
  }) => {
    await page.goto("/#/system/menu");
    await waitForPureTable(page);
    await expect(page.getByText("菜单管理")).toBeVisible();

    await page.getByRole("button", { name: "新增菜单" }).click();
    const dialog = page.locator(".el-dialog").last();
    await dialog.getByText("Iframe").click();
    await dialog.getByPlaceholder("请输入菜单名称").fill("危险 iframe");
    await dialog.getByPlaceholder("请输入路由路径").fill("/audit/frame-unsafe");
    await dialog
      .getByPlaceholder("请输入组件路径")
      .fill("/src/views/error/404.vue");
    await dialog
      .getByPlaceholder("请输入同源或白名单 Iframe 链接地址")
      .fill("https://evil.example.com/embed");
    await page.getByRole("button", { name: "确定" }).click();
    await expect(dialog).toContainText("当前链接不在受信任域名范围内");
    await dialog.locator(".el-dialog__headerbtn").click();

    await page.goto("/#/audit/frame-same-origin");
    const sameOriginFrame = page.locator("iframe");
    await expect(sameOriginFrame).toBeVisible();
    await expect(sameOriginFrame).toHaveAttribute("sandbox", /allow-scripts/);
    await expect(sameOriginFrame).toHaveAttribute(
      "referrerpolicy",
      "no-referrer"
    );
    await expect(sameOriginFrame).toHaveAttribute(
      "src",
      /platform-config\.json/
    );

    await page.goto("/#/audit/frame-whitelist");
    const whitelistFrame = page.locator("iframe");
    await expect(whitelistFrame).toBeVisible();
    await expect(whitelistFrame).toHaveAttribute(
      "src",
      /trusted\.example\.com/
    );

    await page.goto("/#/audit/frame-blocked");
    await expect(page.getByText("嵌入内容已拦截")).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("CSV:53 文档中心页补齐资金/采购/销售页的导出、打印与批量审核证据", async ({
    page
  }) => {
    await stubWindowOpen(page);
    let approveRequestCount = 0;
    page.on("request", request => {
      if (request.url().includes("/api/v1/document-center/approve")) {
        approveRequestCount += 1;
      }
    });

    await page.goto("/#/fund/documents");
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText("FKD-20260309-001");
    await tableRowByText(page, "FKD-20260309-001")
      .locator(".el-checkbox")
      .first()
      .click();

    const fundApprovePromise = page.waitForResponse(response =>
      response.url().includes("/api/v1/document-center/approve")
    );
    await page.getByRole("button", { name: "批量审核" }).click();
    await fundApprovePromise;
    await expectSuccessMessage(page, "批量审核成功");

    const fundExportPromise = page.waitForResponse(response =>
      response.url().includes("/api/v1/document-center/export")
    );
    await page.getByRole("button", { name: "导出" }).click();
    await fundExportPromise;
    await expectSuccessMessage(page, "下载成功");

    await tableRowByText(page, "FKD-20260309-001")
      .locator('[aria-label="Select this row"]')
      .click();
    const fundPrintPromise = page.waitForResponse(response =>
      response
        .url()
        .includes("/api/v1/document-center/print/PAYMENT/doc-fund-1")
    );
    await page.getByRole("button", { name: "打印" }).click();
    await fundPrintPromise;

    await page.goto("/#/purchase/documents");
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText(
      "CGDD-20260309-001"
    );
    const purchaseApproveCount = approveRequestCount;
    const purchaseHeader = page.getByText("采购单据汇总").first().locator("..");
    await purchaseHeader.getByRole("button", { name: "批量审核" }).click();
    await page.waitForTimeout(300);
    expect(approveRequestCount).toBe(purchaseApproveCount);
    const purchaseExportPromise = page.waitForResponse(response =>
      response.url().includes("/api/v1/document-center/export")
    );
    await purchaseHeader.getByRole("button", { name: "导出" }).click();
    await purchaseExportPromise;
    await expectSuccessMessage(page, "下载成功");
    const purchasePrintPromise = page.waitForResponse(response =>
      response
        .url()
        .includes("/api/v1/document-center/print/PURCHASE_ORDER/doc-purchase-1")
    );
    await tableRowByText(page, "CGDD-20260309-001")
      .getByRole("button", { name: "打印" })
      .click();
    await purchasePrintPromise;

    await page.goto("/#/sales/documents");
    await waitForPureTable(page);
    await expect(page.locator(".pure-table")).toContainText(
      "XSDD-20260309-001"
    );
    const salesApproveCount = approveRequestCount;
    const salesHeader = page.getByText("销售单据汇总").first().locator("..");
    await salesHeader.getByRole("button", { name: "批量审核" }).click();
    await page.waitForTimeout(300);
    expect(approveRequestCount).toBe(salesApproveCount);
    const salesExportPromise = page.waitForResponse(response =>
      response.url().includes("/api/v1/document-center/export")
    );
    await salesHeader.getByRole("button", { name: "导出" }).click();
    await salesExportPromise;
    await expectSuccessMessage(page, "下载成功");
    const salesPrintPromise = page.waitForResponse(response =>
      response
        .url()
        .includes("/api/v1/document-center/print/SALE_ORDER/doc-sales-1")
    );
    await tableRowByText(page, "XSDD-20260309-001")
      .getByRole("button", { name: "打印" })
      .click();
    await salesPrintPromise;
  });
});

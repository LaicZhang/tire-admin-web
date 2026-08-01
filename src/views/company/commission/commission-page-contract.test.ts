import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("commission admin page contract", () => {
  it("registers the commission route and exposes settlement lifecycle actions", () => {
    const routeSource = readFileSync(
      resolve(process.cwd(), "src/router/modules/auth.ts"),
      "utf8"
    );
    const pageSource = readFileSync(
      resolve(process.cwd(), "src/views/company/commission/index.vue"),
      "utf8"
    );

    expect(routeSource).toContain('path: "/company/commission"');
    expect(routeSource).toContain("@/views/company/commission/index.vue");
    expect(pageSource).toContain("createCommissionSettlementApi");
    expect(pageSource).toContain("submitCommissionSettlementApi");
    expect(pageSource).toContain("approveCommissionSettlementApi");
    expect(pageSource).toContain("rejectCommissionSettlementApi");
    expect(pageSource).toContain("reverseCommissionSettlementApi");
    expect(pageSource).toContain("mergeCommissionIntoPayrollApi");
    expect(pageSource).toContain("payCommissionImmediateApi");
    expect(pageSource).toContain("payoutMode");
    expect(pageSource).toContain("按销售员汇总");
  });
});

describe("payroll admin pages contract", () => {
  it("registers salary-item, social-rate and payroll-run routes with CTAs", () => {
    const routeSource = readFileSync(
      resolve(process.cwd(), "src/router/modules/auth.ts"),
      "utf8"
    );
    const payrollPage = readFileSync(
      resolve(process.cwd(), "src/views/company/payroll-run/index.vue"),
      "utf8"
    );
    const itemPage = readFileSync(
      resolve(process.cwd(), "src/views/company/salary-item/index.vue"),
      "utf8"
    );
    const ratePage = readFileSync(
      resolve(process.cwd(), "src/views/company/social-rate/index.vue"),
      "utf8"
    );

    expect(routeSource).toContain('path: "/company/salary-item"');
    expect(routeSource).toContain('path: "/company/social-rate"');
    expect(routeSource).toContain('path: "/company/payroll-run"');
    expect(routeSource).toContain("@/views/company/payroll-run/index.vue");
    expect(itemPage).toContain("getSalaryItemsApi");
    expect(ratePage).toContain("upsertSocialRateApi");
    expect(payrollPage).toContain("generatePayrollRunApi");
    expect(payrollPage).toContain("confirmPayrollRunApi");
    expect(payrollPage).toContain("accruePayrollRunApi");
    expect(payrollPage).toContain("disbursePayrollRunApi");
    expect(payrollPage).toContain("dispatchPayslipsApi");
    expect(payrollPage).toContain("PaymentSelect");
  });
});

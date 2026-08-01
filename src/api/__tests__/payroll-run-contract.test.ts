import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import {
  accruePayrollRunApi,
  confirmPayrollRunApi,
  disbursePayrollRunApi,
  generatePayrollRunApi,
  listPayrollRunsApi
} from "../company/payroll-run";
import { dispatchPayslipsApi } from "../company/payslip";
import { getSalaryItemsApi } from "../company/salary-item";
import { getSocialRateApi, upsertSocialRateApi } from "../company/social-rate";

vi.mock("@/utils/http", () => ({ http: { request: vi.fn() } }));

describe("payroll full-loop API contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("lists salary items and social rate", async () => {
    await getSalaryItemsApi({ activeOnly: true });
    await getSocialRateApi();
    await upsertSocialRateApi({
      contributionBase: 500000,
      employeePensionBp: 800,
      employeeMedicalBp: 200,
      employeeUnemploymentBp: 50,
      employeeInjuryBp: 0,
      employeeBirthBp: 0,
      employeeHousingBp: 1200,
      companyPensionBp: 1600,
      companyMedicalBp: 800,
      companyUnemploymentBp: 50,
      companyInjuryBp: 20,
      companyBirthBp: 80,
      companyHousingBp: 1200
    });

    expect(http.request).toHaveBeenNthCalledWith(
      1,
      "get",
      "/api/v1/salary-item/",
      { params: { activeOnly: true } }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      2,
      "get",
      "/api/v1/social-rate"
    );
    expect(http.request).toHaveBeenNthCalledWith(
      3,
      "put",
      "/api/v1/social-rate",
      {
        data: expect.objectContaining({ contributionBase: 500000 })
      }
    );
  });

  it("covers generate/confirm/accrue/disburse/payslip dispatch", async () => {
    await listPayrollRunsApi({ period: 202608 });
    await generatePayrollRunApi({ period: 202608, copyFromPrevious: true });
    await confirmPayrollRunApi("run-1");
    await accruePayrollRunApi("run-1", "月度计提");
    await disbursePayrollRunApi("run-1", {
      paymentId: "pay-1",
      amount: 10000,
      reason: "发放"
    });
    await dispatchPayslipsApi("run-1", "batch-1");

    expect(http.request).toHaveBeenNthCalledWith(
      1,
      "get",
      "/api/v1/payroll-run",
      {
        params: { period: 202608 }
      }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      2,
      "post",
      "/api/v1/payroll-run/generate",
      { data: { period: 202608, copyFromPrevious: true } }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      3,
      "post",
      "/api/v1/payroll-run/run-1/confirm"
    );
    expect(http.request).toHaveBeenNthCalledWith(
      4,
      "post",
      "/api/v1/payroll-run/run-1/accrue",
      { data: { reason: "月度计提" } }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      5,
      "post",
      "/api/v1/payroll-run/run-1/disburse",
      { data: { paymentId: "pay-1", amount: 10000, reason: "发放" } }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      6,
      "post",
      "/api/v1/payslip/run/run-1/dispatch",
      { data: { batchKey: "batch-1" } }
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import {
  approveCommissionSettlementApi,
  createCommissionSettlementApi,
  getCommissionRecordsApi,
  mergeCommissionIntoPayrollApi,
  payCommissionImmediateApi,
  reverseCommissionSettlementApi,
  submitCommissionSettlementApi
} from "../company/commission";

vi.mock("@/utils/http", () => ({ http: { request: vi.fn() } }));

describe("commission lifecycle API contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("lists records and creates a salesperson settlement with required payoutMode", async () => {
    await getCommissionRecordsApi(2, { salespersonId: "employee-1" });
    expect(http.request).toHaveBeenNthCalledWith(
      1,
      "get",
      "/api/v1/commission/records/page/2",
      { params: { salespersonId: "employee-1" } }
    );

    await createCommissionSettlementApi({
      salespersonId: "employee-1",
      payoutMode: "PAYROLL",
      recordUids: ["record-1"]
    });
    expect(http.request).toHaveBeenNthCalledWith(
      2,
      "post",
      "/api/v1/commission/settlements",
      {
        data: {
          salespersonId: "employee-1",
          payoutMode: "PAYROLL",
          recordUids: ["record-1"]
        }
      }
    );
  });

  it("uses distinct submit, approve and reversal actions", async () => {
    await submitCommissionSettlementApi("settlement-1");
    await approveCommissionSettlementApi("settlement-1");
    await reverseCommissionSettlementApi("settlement-1", "金额错误");

    expect(http.request).toHaveBeenNthCalledWith(
      1,
      "post",
      "/api/v1/commission/settlements/settlement-1/submit"
    );
    expect(http.request).toHaveBeenNthCalledWith(
      2,
      "post",
      "/api/v1/commission/settlements/settlement-1/approve"
    );
    expect(http.request).toHaveBeenNthCalledWith(
      3,
      "post",
      "/api/v1/commission/settlements/settlement-1/reverse",
      { data: { reason: "金额错误" } }
    );
  });

  it("merges PAYROLL settlement and pays IMMEDIATE via dedicated endpoints", async () => {
    await mergeCommissionIntoPayrollApi("settlement-1", "run-1");
    await payCommissionImmediateApi("settlement-2", "payment-1");

    expect(http.request).toHaveBeenNthCalledWith(
      1,
      "post",
      "/api/v1/commission/settlements/settlement-1/merge-payroll",
      { data: { payrollRunId: "run-1" } }
    );
    expect(http.request).toHaveBeenNthCalledWith(
      2,
      "post",
      "/api/v1/commission/settlements/settlement-2/pay-immediate",
      { data: { paymentId: "payment-1" } }
    );
  });
});

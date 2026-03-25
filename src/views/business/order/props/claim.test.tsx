import { describe, expect, it } from "vitest";
import {
  getClaimTraceSummaryLines,
  getSupplierClaimOrderStatusLabel
} from "./claim";

describe("business/order/claim props", () => {
  it("renders latest business into claim trace summary", () => {
    expect(
      getClaimTraceSummaryLines({
        serialNo: "SN-001",
        latestBusiness: {
          type: "SUPPLIER_CLAIM",
          orderId: "supplier-claim-1",
          docNo: "SCO-001",
          status: "APPROVED"
        }
      })
    ).toContain("最近业务：SUPPLIER_CLAIM · SCO-001 · APPROVED");
  });

  it("maps supplier claim order status labels", () => {
    expect(
      getSupplierClaimOrderStatusLabel({ isApproved: true, isReversed: false })
    ).toBe("已审核");
    expect(
      getSupplierClaimOrderStatusLabel({ isApproved: false, isReversed: false })
    ).toBe("待审核");
    expect(
      getSupplierClaimOrderStatusLabel({ isApproved: true, isReversed: true })
    ).toBe("已作废");
  });
});

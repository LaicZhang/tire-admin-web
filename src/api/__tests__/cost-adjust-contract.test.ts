import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ data: "fixture" }),
  post: vi.fn().mockResolvedValue({ data: "fixture" }),
  patch: vi.fn().mockResolvedValue({ data: "fixture" }),
  delete: vi.fn().mockResolvedValue({ data: "fixture" })
}));

vi.mock("@/utils/http", () => ({ http }));

import {
  approveCostAdjustOrder,
  createCostAdjustOrder,
  deleteCostAdjustOrder,
  getCostAdjustOrderDetail,
  getCostAdjustOrderList,
  rejectCostAdjustOrder,
  reverseAuditCostAdjustOrder,
  updateCostAdjustOrder
} from "@/api/business/costAdjust";

const dto = {
  operatorId: "operator-1",
  reason: "fixture",
  details: [
    { repoId: "1", tireId: "2", originalCost: 10, adjustedCost: 12, count: 1 }
  ]
};

describe("cost adjustment API contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps every cost adjustment action to its endpoint and payload", async () => {
    await createCostAdjustOrder(dto);
    expect(http.post).toHaveBeenCalledWith("/cost-adjust-order", { data: dto });

    await getCostAdjustOrderList({ index: 2, isApproved: false });
    expect(http.get).toHaveBeenCalledWith("/cost-adjust-order", {
      params: { index: 2, isApproved: false }
    });

    await getCostAdjustOrderDetail(7);
    expect(http.get).toHaveBeenCalledWith("/cost-adjust-order/7");

    await updateCostAdjustOrder(7, { reason: "updated" });
    expect(http.patch).toHaveBeenCalledWith("/cost-adjust-order/7", {
      data: { reason: "updated" }
    });

    await approveCostAdjustOrder(7);
    expect(http.post).toHaveBeenCalledWith("/cost-adjust-order/7/approve");

    await reverseAuditCostAdjustOrder(7);
    expect(http.post).toHaveBeenCalledWith(
      "/cost-adjust-order/7/reverse-audit"
    );

    await rejectCostAdjustOrder(7, "invalid");
    expect(http.post).toHaveBeenCalledWith("/cost-adjust-order/7/reject", {
      data: { reason: "invalid" }
    });

    await deleteCostAdjustOrder(7);
    expect(http.delete).toHaveBeenCalledWith("/cost-adjust-order/7");
  });
});

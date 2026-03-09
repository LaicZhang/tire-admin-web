import { describe, expect, it, vi } from "vitest";

vi.mock("@pureadmin/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@pureadmin/utils")>();
  return {
    ...actual,
    deviceDetection: () => false
  };
});

vi.mock("@/api", () => ({
  getCompanyId: vi.fn(),
  getCompanyConnect: vi.fn(),
  addOrderApi: vi.fn(),
  updateOrderApi: vi.fn(),
  payPurchaseOrderApi: vi.fn(),
  paySaleOrderApi: vi.fn(),
  processClaimOrderPaymentApi: vi.fn(),
  refundReturnOrderApi: vi.fn(),
  confirmPurchaseOrderArrivalApi: vi.fn()
}));

vi.mock("../../../components/ReDialog", () => ({
  addDialog: vi.fn()
}));

vi.mock("./form.vue", () => ({
  default: { template: "<div />" }
}));

import { ORDER_TYPE } from "@/utils";
import { buildCreateOrderPayload } from "./table";

describe("business/order/table", () => {
  it("builds surplus order payload with repo-based details", () => {
    const payload = buildCreateOrderPayload(
      ORDER_TYPE.surplus,
      {
        uid: "surplus-uid",
        auditorId: "manager-1",
        count: 2,
        total: 0,
        details: [
          {
            index: 1,
            repoId: "repo-1",
            tireId: "tire-1",
            count: 2,
            desc: "盘盈"
          }
        ]
      },
      "company-1"
    );

    expect(payload).toEqual({
      order: expect.objectContaining({
        uid: "surplus-uid",
        count: 2,
        total: 0,
        company: { connect: { uid: "company-1" } },
        auditor: { connect: { uid: "manager-1" } }
      }),
      details: [
        {
          companyId: "company-1",
          repoId: "repo-1",
          tireId: "tire-1",
          count: 2,
          desc: "盘盈"
        }
      ]
    });
  });

  it("builds waste order payload with generated detail numbers", () => {
    const payload = buildCreateOrderPayload(
      ORDER_TYPE.waste,
      {
        uid: "waste-uid",
        auditorId: "manager-2",
        count: 1,
        total: 0,
        details: [
          {
            index: 1,
            repoId: "repo-2",
            tireId: "tire-2",
            count: 1
          }
        ]
      },
      "company-2"
    );

    expect(payload).toEqual({
      order: expect.objectContaining({
        uid: "waste-uid",
        count: 1,
        total: 0,
        company: { connect: { uid: "company-2" } },
        auditor: { connect: { uid: "manager-2" } }
      }),
      details: [
        {
          companyId: "company-2",
          repoId: "repo-2",
          tireId: "tire-2",
          count: 1,
          number: "WD-waste-uid-1",
          desc: undefined
        }
      ]
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  getSaleQuotationStatusLabel,
  getSaleQuotationTotal
} from "./sale-quotation";

describe("business/order/saleQuotation props", () => {
  it("maps backend sale quotation statuses", () => {
    expect(getSaleQuotationStatusLabel("DRAFT")).toBe("草稿");
    expect(getSaleQuotationStatusLabel("SENT")).toBe("已发送");
    expect(getSaleQuotationStatusLabel("ACCEPTED")).toBe("已接受");
    expect(getSaleQuotationStatusLabel("REJECTED")).toBe("已拒绝");
    expect(getSaleQuotationStatusLabel("EXPIRED")).toBe("已过期");
  });

  it("computes total from quotation details first", () => {
    expect(
      getSaleQuotationTotal({
        totalAmount: "999999",
        details: [
          { quantity: 2, quotedPrice: 1000 },
          { quantity: 1, quotedPrice: 2500 }
        ]
      })
    ).toBe(4500);
  });
});

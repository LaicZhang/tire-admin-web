import { describe, expect, it } from "vitest";
import { applySalePriceQuote } from "./priceQuote";

describe("sale order authoritative price quote", () => {
  it("replaces editable prices and totals with quoted values", () => {
    const details = [
      {
        tireId: "tire-1",
        count: 2,
        unitPrice: 1,
        total: 2,
        isShipped: false,
        isDelivered: false
      }
    ];

    const total = applySalePriceQuote(details, {
      customerId: "customer-1",
      totalAmount: "500",
      lines: [
        {
          tireId: "tire-1",
          count: 2,
          unitPrice: "250",
          totalAmount: "500",
          priceListId: 7,
          priceType: "SPECIAL",
          source: "PRICE_LIST"
        }
      ]
    });

    expect(details[0]).toEqual(
      expect.objectContaining({ unitPrice: 250, total: 500 })
    );
    expect(total).toBe(500);
  });

  it("rejects a quote whose line identity or quantity does not match", () => {
    const details = [
      {
        tireId: "tire-1",
        count: 2,
        unitPrice: 0,
        total: 0,
        isShipped: false,
        isDelivered: false
      }
    ];

    expect(() =>
      applySalePriceQuote(details, {
        customerId: "customer-1",
        totalAmount: 100,
        lines: [
          {
            tireId: "tire-2",
            count: 1,
            unitPrice: 100,
            totalAmount: 100,
            priceListId: 1,
            priceType: "STANDARD",
            source: "PRICE_LIST"
          }
        ]
      })
    ).toThrow("报价明细与订单不一致");
  });
});

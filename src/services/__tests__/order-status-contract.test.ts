import { describe, expect, it } from "vitest";
import {
  LogisticsStatus,
  LOGISTICS_STATUS_LABELS,
  PaymentStatus,
  PAYMENT_STATUS_LABELS,
  logisticsStatusLabel,
  paymentStatusLabel
} from "../order.service";
import {
  LOGISTICS_STATUS_MAP as salesLogisticsMap,
  PAYMENT_STATUS_MAP as salesPaymentMap
} from "@/views/sales/order/types";
import {
  LOGISTICS_STATUS_MAP as purchaseLogisticsMap,
  PAYMENT_STATUS_MAP as purchasePaymentMap
} from "@/views/purchase/order/types";

/** Backend OrderStatusEnum / LogisticsStatusEnum contract (UI-001) */
describe("order status contract (UI-001)", () => {
  it("maps payment orderStatus 0..3 to backend semantics", () => {
    expect(PaymentStatus.UNPAID).toBe(0);
    expect(PaymentStatus.PARTIAL).toBe(1);
    expect(PaymentStatus.PAID).toBe(2);
    expect(PaymentStatus.CANCELLED).toBe(3);

    expect(PAYMENT_STATUS_LABELS[0]).toBe("待支付");
    expect(PAYMENT_STATUS_LABELS[1]).toBe("部分支付");
    expect(PAYMENT_STATUS_LABELS[2]).toBe("已付清");
    expect(PAYMENT_STATUS_LABELS[3]).toBe("已取消");

    for (const value of [0, 1, 2, 3] as const) {
      expect(paymentStatusLabel(value)).toBe(PAYMENT_STATUS_LABELS[value]);
      expect(salesPaymentMap[value]).toBe(PAYMENT_STATUS_LABELS[value]);
      expect(purchasePaymentMap[value]).toBe(PAYMENT_STATUS_LABELS[value]);
    }
  });

  it("maps logisticsStatus 0..4", () => {
    expect(LogisticsStatus.Pending).toBe(0);
    expect(LogisticsStatus.PartialShipped).toBe(1);
    expect(LogisticsStatus.Shipped).toBe(2);
    expect(LogisticsStatus.Delivered).toBe(3);
    expect(LogisticsStatus.Cancelled).toBe(4);

    for (const value of [0, 1, 2, 3, 4] as const) {
      expect(logisticsStatusLabel(value)).toBe(LOGISTICS_STATUS_LABELS[value]);
      expect(salesLogisticsMap[value]).toBeDefined();
      expect(purchaseLogisticsMap[value]).toBeDefined();
    }
  });

  it("renders unknown payment/logistics values explicitly", () => {
    expect(paymentStatusLabel(99)).toBe("未知(99)");
    expect(paymentStatusLabel(null)).toBe("未知");
    expect(logisticsStatusLabel(99)).toBe("未知(99)");
  });
});

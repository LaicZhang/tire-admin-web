import type { SalePriceQuote } from "@/api/business/price-list";
import type { SalesOrderDetail } from "./types";

function toSafeMoney(value: number | string) {
  const money = Number(value);
  if (!Number.isFinite(money) || money < 0) {
    throw new Error("服务端报价金额不合法");
  }
  return money;
}

export function applySalePriceQuote(
  details: SalesOrderDetail[],
  quote: SalePriceQuote
) {
  if (details.length !== quote.lines.length) {
    throw new Error("报价明细与订单不一致");
  }
  quote.lines.forEach((line, index) => {
    const detail = details[index];
    if (detail.tireId !== line.tireId || detail.count !== line.count) {
      throw new Error("报价明细与订单不一致");
    }
    detail.unitPrice = toSafeMoney(line.unitPrice);
    detail.total = toSafeMoney(line.totalAmount);
    detail.discountRate = 0;
    detail.discountAmount = 0;
  });
  return toSafeMoney(quote.totalAmount);
}

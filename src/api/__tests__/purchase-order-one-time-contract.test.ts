import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("purchase order one-time contract", () => {
  it("removes the legacy purchase-order confirm-arrival client and actions", () => {
    const api = read("src/api/business/order.ts");
    const businessPage = read("src/views/business/order/index.vue");
    const purchasePage = read("src/views/purchase/order/index.vue");

    expect(api).not.toContain("confirmPurchaseOrderArrivalApi");
    expect(api).not.toContain("/purchase-order/confirm-arrival/");
    expect(businessPage).not.toContain("handleConfirmPurchaseArrival");
    expect(purchasePage).not.toContain("onConfirmArrival");
  });
});

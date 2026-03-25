import { describe, expect, it } from "vitest";
import { ORDER_TYPE } from "@/utils/const";
import { resolveRouteOrderType } from "./routeOrderType";

describe("resolveRouteOrderType", () => {
  it("returns supplier claim for the dedicated supplier claim route", () => {
    expect(
      resolveRouteOrderType({
        path: "/business/supplierClaim"
      })
    ).toBe(ORDER_TYPE.supplierClaim);
  });

  it("prefers the explicit query order type when provided", () => {
    expect(
      resolveRouteOrderType({
        path: "/business/supplierClaim",
        queryOrderType: ORDER_TYPE.return
      })
    ).toBe(ORDER_TYPE.return);
  });
});

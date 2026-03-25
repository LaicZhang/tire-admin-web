import { describe, expect, it } from "vitest";
import { getOrderTypeList, ORDER_TYPE } from "./const";

describe("utils/const order types", () => {
  it("exposes supplier claim order for privileged roles", () => {
    const adminTypes = getOrderTypeList(["admin"]);
    const financeTypes = getOrderTypeList(["finance"]);

    expect(adminTypes).toContainEqual({
      value: ORDER_TYPE.supplierClaim,
      label: "供应商索赔单"
    });
    expect(financeTypes).toContainEqual({
      value: ORDER_TYPE.supplierClaim,
      label: "供应商索赔单"
    });
  });
});

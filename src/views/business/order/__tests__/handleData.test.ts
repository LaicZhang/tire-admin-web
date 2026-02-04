import { describe, expect, it } from "vitest";
import { ORDER_TYPE } from "@/utils";
import { getColumns, getCommonData, getFormRules } from "../handleData";

describe("business/order/handleData", () => {
  it("getCommonData omits auditor when auditorId is missing", () => {
    const result = getCommonData("u1", "c1", {});

    expect(result).toEqual({
      uid: "u1",
      company: {
        connect: { uid: "c1" }
      }
    });
    expect("auditor" in result).toBe(false);
  });

  it("getCommonData includes auditor when auditorId is provided", () => {
    const result = getCommonData("u1", "c1", { auditorId: "a1" });

    expect(result).toEqual({
      uid: "u1",
      company: {
        connect: { uid: "c1" }
      },
      auditor: {
        connect: { uid: "a1" }
      }
    });
  });

  it("getColumns returns columns for known types and [] for default", () => {
    expect(getColumns(ORDER_TYPE.purchase).length).toBeGreaterThan(0);
    expect(getColumns(ORDER_TYPE.sale).length).toBeGreaterThan(0);
    expect(getColumns(ORDER_TYPE.default)).toEqual([]);
  });

  it("getFormRules returns rules for known types and {} for default", () => {
    expect(
      Object.keys(getFormRules(ORDER_TYPE.purchase)).length
    ).toBeGreaterThan(0);
    expect(getFormRules(ORDER_TYPE.default)).toEqual({});
  });
});

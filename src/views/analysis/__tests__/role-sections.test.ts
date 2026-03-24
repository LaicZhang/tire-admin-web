import { describe, expect, it } from "vitest";
import {
  getAnalysisSectionOrder,
  resolveAnalysisRoleView
} from "@/utils/analysisRole";

describe("analysis role helpers", () => {
  it("maps backend and legacy sales roles to sales view", () => {
    expect(resolveAnalysisRoleView(["seller"])).toBe("sales");
    expect(resolveAnalysisRoleView(["sellerManager"])).toBe("sales");
  });

  it("maps warehouse aliases to warehouse view", () => {
    expect(resolveAnalysisRoleView(["warehouseManager"])).toBe("warehouse");
    expect(resolveAnalysisRoleView(["warehouseEmployee"])).toBe("warehouse");
  });

  it("returns sales-focused section order", () => {
    expect(getAnalysisSectionOrder("sales", "sales")).toEqual([
      "summary",
      "tracking",
      "trend",
      "ranking"
    ]);
  });

  it("returns finance-focused purchase section order", () => {
    expect(getAnalysisSectionOrder("purchase", "finance")).toEqual([
      "summary",
      "tracking",
      "trend",
      "evaluation"
    ]);
  });

  it("returns warehouse-focused inventory section order", () => {
    expect(getAnalysisSectionOrder("inventory", "warehouse")).toEqual([
      "summary",
      "movement",
      "stockout",
      "slowMoving",
      "expiry",
      "dotAging",
      "turnover"
    ]);
  });
});

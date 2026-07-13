import { describe, expect, it } from "vitest";
import { toCostAdjustFormData, toCostAdjustPayload } from "./money";

describe("cost adjust money mapping", () => {
  it("converts yuan form values to integer cents for submission", () => {
    const payload = toCostAdjustPayload({
      operatorId: "operator-1",
      auditorId: "auditor-1",
      reason: "库存校正",
      details: [
        {
          repoId: "repo-1",
          tireId: "tire-1",
          originalCost: 12.34,
          adjustedCost: 15.67,
          count: 2
        }
      ]
    });

    expect(payload.details[0].originalCost).toBe(1234);
    expect(payload.details[0].adjustedCost).toBe(1567);
  });

  it("converts stored cents to yuan for form display", () => {
    const form = toCostAdjustFormData({
      operatorId: "operator-1",
      auditorId: "auditor-1",
      details: [
        {
          repoId: "repo-1",
          tireId: "tire-1",
          originalCost: 1234,
          adjustedCost: 1567,
          count: 2
        }
      ]
    });

    expect(form.details[0].originalCost).toBe(12.34);
    expect(form.details[0].adjustedCost).toBe(15.67);
  });
});

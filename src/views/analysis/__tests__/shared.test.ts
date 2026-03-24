import { describe, expect, it } from "vitest";
import {
  buildAnalysisQuery,
  parseAnalysisFilters
} from "@/views/analysis/shared";

describe("analysis shared query helpers", () => {
  it("builds operatorId into analysis query", () => {
    const query = buildAnalysisQuery({
      dateRange: [new Date("2026-03-01"), new Date("2026-03-24")],
      storeId: "store-1",
      repoId: "repo-1",
      extras: {
        operatorId: "member-1"
      }
    });

    expect(query).toMatchObject({
      startDate: "2026-03-01",
      endDate: "2026-03-24",
      storeId: "store-1",
      repoId: "repo-1",
      operatorId: "member-1"
    });
  });

  it("parses operatorId from analysis query", () => {
    const parsed = parseAnalysisFilters({
      operatorId: "member-2",
      startDate: "2026-03-01",
      endDate: "2026-03-24"
    });

    expect(parsed.operatorId).toBe("member-2");
  });
});

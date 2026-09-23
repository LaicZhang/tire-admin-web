import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import {
  buildAnalysisFilterQuery,
  buildAnalysisQuery,
  createDefaultAnalysisFilterState,
  defaultAnalysisDateRange,
  inferGroupBy,
  parseAnalysisFilters,
  toRequiredDateParams
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

  it("infers groupBy by range length", () => {
    expect(inferGroupBy([new Date("2026-03-01"), new Date("2026-03-15")])).toBe(
      "day"
    );
    expect(inferGroupBy([new Date("2026-01-01"), new Date("2026-03-15")])).toBe(
      "week"
    );
    expect(inferGroupBy([new Date("2025-01-01"), new Date("2026-03-15")])).toBe(
      "month"
    );
  });

  it("defaults to near-30-day range with inferred day groupBy", () => {
    const state = createDefaultAnalysisFilterState();
    const [start, end] = state.dateRange!;
    const days = dayjs(end)
      .startOf("day")
      .diff(dayjs(start).startOf("day"), "day");
    expect(days).toBe(29);
    expect(state.groupBy).toBe("day");
    const required = toRequiredDateParams(null);
    expect(required.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(required.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("round-trips filters including groupBy and dim via URL helpers", () => {
    const state = createDefaultAnalysisFilterState({
      dateRange: [new Date("2026-02-01"), new Date("2026-04-15")],
      storeId: "s1",
      repoId: "r1",
      operatorId: "o1",
      groupBy: "week",
      dim: "customer"
    });
    const query = buildAnalysisFilterQuery(state);
    expect(query).toMatchObject({
      startDate: "2026-02-01",
      endDate: "2026-04-15",
      storeId: "s1",
      repoId: "r1",
      operatorId: "o1",
      groupBy: "week",
      dim: "customer"
    });

    const parsed = parseAnalysisFilters(query as Record<string, string>);
    expect(parsed.storeId).toBe("s1");
    expect(parsed.repoId).toBe("r1");
    expect(parsed.operatorId).toBe("o1");
    expect(parsed.groupBy).toBe("week");
    expect(parsed.dim).toBe("customer");
    expect(dayjs(parsed.dateRange![0]).format("YYYY-MM-DD")).toBe("2026-02-01");
    expect(dayjs(parsed.dateRange![1]).format("YYYY-MM-DD")).toBe("2026-04-15");
  });

  it("infers groupBy from URL when groupBy missing", () => {
    const parsed = parseAnalysisFilters({
      startDate: "2026-01-01",
      endDate: "2026-06-01"
    });
    expect(parsed.groupBy).toBe("month");
  });

  it("keeps defaultAnalysisDateRange length at 30 calendar days inclusive", () => {
    const [start, end] = defaultAnalysisDateRange();
    expect(
      dayjs(end).startOf("day").diff(dayjs(start).startOf("day"), "day")
    ).toBe(29);
  });
});

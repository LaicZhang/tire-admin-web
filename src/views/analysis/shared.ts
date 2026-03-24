import dayjs from "dayjs";
import type { LocationQuery, LocationQueryRaw } from "vue-router";

export type AnalysisDateRange = [Date, Date] | null;

function getQueryString(query: LocationQuery, key: string): string | undefined {
  const value = query[key];
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
}

export function parseDateRangeQuery(query: LocationQuery): AnalysisDateRange {
  const startDate = getQueryString(query, "startDate");
  const endDate = getQueryString(query, "endDate");
  if (!startDate || !endDate) return null;

  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (!start.isValid() || !end.isValid()) return null;

  return [start.toDate(), end.toDate()];
}

export function buildAnalysisQuery(params: {
  dateRange?: AnalysisDateRange;
  storeId?: string;
  repoId?: string;
  extras?: Record<string, string | undefined>;
}): LocationQueryRaw {
  const query: LocationQueryRaw = {};
  if (params.dateRange) {
    query.startDate = dayjs(params.dateRange[0]).format("YYYY-MM-DD");
    query.endDate = dayjs(params.dateRange[1]).format("YYYY-MM-DD");
  }
  if (params.storeId) query.storeId = params.storeId;
  if (params.repoId) query.repoId = params.repoId;
  for (const [key, value] of Object.entries(params.extras ?? {})) {
    if (value) query[key] = value;
  }
  return query;
}

export function toDateParams(dateRange: AnalysisDateRange) {
  if (!dateRange) return {};
  return {
    startDate: dayjs(dateRange[0]).format("YYYY-MM-DD"),
    endDate: dayjs(dateRange[1]).format("YYYY-MM-DD")
  };
}

export function parseAnalysisFilters(query: LocationQuery) {
  return {
    dateRange: parseDateRangeQuery(query),
    storeId: getQueryString(query, "storeId") ?? "",
    repoId: getQueryString(query, "repoId") ?? ""
  };
}

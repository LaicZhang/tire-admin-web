import dayjs from "dayjs";
import type { LocationQuery, LocationQueryRaw } from "vue-router";

export type AnalysisDateRange = [Date, Date] | null;
export type AnalysisGroupBy = "day" | "week" | "month";

export interface AnalysisFilterState {
  dateRange: AnalysisDateRange;
  storeId: string;
  repoId: string;
  operatorId: string;
  /** Time grain only — never reuse for dimension APIs */
  groupBy: AnalysisGroupBy;
  /** Dimension group key (tire|provider|customer|operator); separate from groupBy */
  dim?: string;
}

function getQueryString(query: LocationQuery, key: string): string | undefined {
  const value = query[key];
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
}

export function defaultAnalysisDateRange(): [Date, Date] {
  return [
    dayjs().subtract(29, "day").startOf("day").toDate(),
    dayjs().endOf("day").toDate()
  ];
}

/** Shared shortcuts: 近7/30/90/本月/上月 */
export const analysisDateShortcuts = [
  {
    text: "近7天",
    value: (): [Date, Date] => [
      dayjs().subtract(6, "day").startOf("day").toDate(),
      dayjs().endOf("day").toDate()
    ]
  },
  {
    text: "近30天",
    value: (): [Date, Date] => [
      dayjs().subtract(29, "day").startOf("day").toDate(),
      dayjs().endOf("day").toDate()
    ]
  },
  {
    text: "近90天",
    value: (): [Date, Date] => [
      dayjs().subtract(89, "day").startOf("day").toDate(),
      dayjs().endOf("day").toDate()
    ]
  },
  {
    text: "本月",
    value: (): [Date, Date] => [
      dayjs().startOf("month").toDate(),
      dayjs().endOf("day").toDate()
    ]
  },
  {
    text: "上月",
    value: (): [Date, Date] => [
      dayjs().subtract(1, "month").startOf("month").toDate(),
      dayjs().subtract(1, "month").endOf("month").toDate()
    ]
  }
] as const;

/**
 * Smart groupBy: ≤31 day / ≤90 week / else month
 */
export function inferGroupBy(dateRange: AnalysisDateRange): AnalysisGroupBy {
  if (!dateRange) return "day";
  const days = Math.max(
    0,
    dayjs(dateRange[1])
      .startOf("day")
      .diff(dayjs(dateRange[0]).startOf("day"), "day")
  );
  if (days <= 31) return "day";
  if (days <= 90) return "week";
  return "month";
}

export function parseGroupBy(
  value: string | undefined
): AnalysisGroupBy | undefined {
  if (value === "day" || value === "week" || value === "month") return value;
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

/** Never emit empty date range to analysis APIs (avoid full-history scan). */
export function ensureAnalysisDateRange(
  dateRange: AnalysisDateRange
): [Date, Date] {
  return dateRange ?? defaultAnalysisDateRange();
}

export function toRequiredDateParams(dateRange: AnalysisDateRange) {
  return toDateParams(ensureAnalysisDateRange(dateRange));
}

export function createDefaultAnalysisFilterState(
  partial?: Partial<AnalysisFilterState>
): AnalysisFilterState {
  const dateRange = partial?.dateRange ?? defaultAnalysisDateRange();
  return {
    dateRange,
    storeId: partial?.storeId ?? "",
    repoId: partial?.repoId ?? "",
    operatorId: partial?.operatorId ?? "",
    groupBy: partial?.groupBy ?? inferGroupBy(dateRange),
    dim: partial?.dim
  };
}

export function parseAnalysisFilters(
  query: LocationQuery
): AnalysisFilterState {
  const dateRange = parseDateRangeQuery(query) ?? defaultAnalysisDateRange();
  const groupByFromUrl = parseGroupBy(getQueryString(query, "groupBy"));
  return {
    dateRange,
    storeId: getQueryString(query, "storeId") ?? "",
    repoId: getQueryString(query, "repoId") ?? "",
    operatorId: getQueryString(query, "operatorId") ?? "",
    groupBy: groupByFromUrl ?? inferGroupBy(dateRange),
    dim: getQueryString(query, "dim")
  };
}

export function buildAnalysisFilterQuery(
  state: AnalysisFilterState
): LocationQueryRaw {
  return buildAnalysisQuery({
    dateRange: ensureAnalysisDateRange(state.dateRange),
    storeId: state.storeId || undefined,
    repoId: state.repoId || undefined,
    extras: {
      operatorId: state.operatorId || undefined,
      groupBy: state.groupBy,
      dim: state.dim
    }
  });
}

export function withInferredGroupBy(
  state: AnalysisFilterState,
  dateRange: AnalysisDateRange
): AnalysisFilterState {
  const range = ensureAnalysisDateRange(dateRange);
  return {
    ...state,
    dateRange: range,
    groupBy: inferGroupBy(range)
  };
}

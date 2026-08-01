import type { LocationQuery } from "vue-router";
import {
  buildAnalysisQuery,
  parseDateRangeQuery,
  type AnalysisDateRange,
  toDateParams
} from "../shared";

export interface TraceWorkbenchFilters {
  dateRange: AnalysisDateRange;
  storeId: string;
  repoId: string;
  module: string;
  incidentType: string;
  status: string;
  keyword: string;
  incidentId: string;
}

function getQueryString(query: LocationQuery, key: string): string {
  const value = query[key];
  return typeof value === "string" ? value : "";
}

export function parseTraceWorkbenchFilters(
  query: LocationQuery
): TraceWorkbenchFilters {
  return {
    dateRange: parseDateRangeQuery(query),
    storeId: getQueryString(query, "storeId"),
    repoId: getQueryString(query, "repoId"),
    module: getQueryString(query, "module"),
    incidentType: getQueryString(query, "incidentType"),
    status: getQueryString(query, "status"),
    keyword: getQueryString(query, "keyword"),
    incidentId: getQueryString(query, "incidentId")
  };
}

export function buildTraceWorkbenchQuery(filters: TraceWorkbenchFilters) {
  return buildAnalysisQuery({
    dateRange: filters.dateRange,
    storeId: filters.storeId || undefined,
    repoId: filters.repoId || undefined,
    extras: {
      module: filters.module || undefined,
      incidentType: filters.incidentType || undefined,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
      incidentId: filters.incidentId || undefined
    }
  });
}

export function toTraceWorkbenchParams(filters: TraceWorkbenchFilters) {
  return {
    ...toDateParams(filters.dateRange),
    storeId: filters.storeId || undefined,
    repoId: filters.repoId || undefined,
    module: filters.module || undefined,
    incidentType: filters.incidentType || undefined,
    status: filters.status || undefined,
    keyword: filters.keyword || undefined
  };
}

import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import type {
  MonitorBusinessSummary,
  MonitorCompanyCard,
  MonitorCronRunItem,
  MonitorCronRunQuery,
  MonitorEmployeeItem,
  MonitorEmployeeQuery,
  MonitorExportQuery,
  MonitorLogListQuery,
  MonitorLoginLogItem,
  MonitorLoginLogQuery,
  MonitorMoneyEventItem,
  MonitorMoneyQuery,
  MonitorOperationLogItem,
  MonitorOverview,
  MonitorPaginated,
  MonitorSensitiveItem,
  MonitorSystemHealth,
  MonitorTimeRangeQuery
} from "./types";

export * from "./types";

type ScopeMode = "platform" | "company";

function prefix(mode: ScopeMode): string {
  return mode === "platform" ? "/monitor/platform" : "/monitor/company";
}

async function getJson<T>(url: string, params?: Record<string, unknown>) {
  return http.request<CommonResult<T>>("get", baseUrlApi(url), { params });
}

export function getMonitorOverviewApi(
  mode: ScopeMode,
  params?: MonitorTimeRangeQuery
) {
  return getJson<MonitorOverview>(`${prefix(mode)}/overview`, params);
}

export function getMonitorBusinessApi(
  mode: ScopeMode,
  params?: MonitorTimeRangeQuery
) {
  return getJson<MonitorBusinessSummary>(`${prefix(mode)}/business`, params);
}

export function getMonitorOperationLogsApi(
  mode: ScopeMode,
  params?: MonitorLogListQuery
) {
  return getJson<MonitorPaginated<MonitorOperationLogItem>>(
    `${prefix(mode)}/logs/operation`,
    params
  );
}

export function getMonitorOperationLogDetailApi(
  mode: ScopeMode,
  id: number,
  params?: { companyId?: string }
) {
  return getJson<MonitorOperationLogItem>(
    `${prefix(mode)}/logs/operation/${id}`,
    params
  );
}

export function getMonitorLoginLogsApi(
  mode: ScopeMode,
  params?: MonitorLoginLogQuery
) {
  return getJson<MonitorPaginated<MonitorLoginLogItem>>(
    `${prefix(mode)}/logs/login`,
    params
  );
}

export function getMonitorSensitiveLogsApi(
  mode: ScopeMode,
  params?: MonitorLogListQuery
) {
  return getJson<MonitorPaginated<MonitorSensitiveItem>>(
    `${prefix(mode)}/logs/sensitive`,
    params
  );
}

export function getMonitorCompaniesApi(
  mode: ScopeMode,
  params?: MonitorTimeRangeQuery & { page?: number; pageSize?: number }
) {
  const path =
    mode === "platform"
      ? `${prefix(mode)}/companies`
      : `${prefix(mode)}/org/company`;
  return getJson<MonitorPaginated<MonitorCompanyCard>>(path, params);
}

export function getMonitorEmployeesApi(
  mode: ScopeMode,
  params?: MonitorEmployeeQuery
) {
  const path =
    mode === "platform"
      ? `${prefix(mode)}/employees`
      : `${prefix(mode)}/org/employees`;
  return getJson<MonitorPaginated<MonitorEmployeeItem>>(path, params);
}

export function getMonitorMoneyApi(
  mode: ScopeMode,
  params?: MonitorMoneyQuery
) {
  return getJson<MonitorPaginated<MonitorMoneyEventItem>>(
    `${prefix(mode)}/money`,
    params
  );
}

export function getMonitorSystemHealthApi(mode: ScopeMode) {
  return getJson<MonitorSystemHealth>(`${prefix(mode)}/system/health`);
}

export function getMonitorCronRunsApi(
  mode: ScopeMode,
  params?: MonitorCronRunQuery
) {
  return getJson<MonitorPaginated<MonitorCronRunItem>>(
    `${prefix(mode)}/system/cron-runs`,
    params
  );
}

/** 导出 CSV：返回 blob 文本 */
export async function exportMonitorCsvApi(
  mode: ScopeMode,
  params?: MonitorExportQuery
): Promise<Blob> {
  return http.request<Blob>("get", baseUrlApi(`${prefix(mode)}/export`), {
    params,
    responseType: "blob"
  });
}

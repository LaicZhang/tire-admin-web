import { http } from "@/utils/http";
import type { CommonResult } from "../type";

export type CronJobRunStatus = "SUCCESS" | "FAILED" | "SKIPPED";

export interface CronJobInfo {
  name: string;
  active: boolean;
  callbackRunning: boolean;
  cron: string;
  timeZone: string | null;
  nextRunAt: string | null;
  enabled: boolean;
  lastRun: null | {
    status: CronJobRunStatus;
    startedAt: string;
    finishedAt: string | null;
    durationMs: number | null;
    errorMessage: string | null;
  };
}

export type UpdateCronJobConfigDto = {
  enabled?: boolean;
  cron?: string;
  timeZone?: string;
};

export const listCronJobsApi = () =>
  http.request<CommonResult<CronJobInfo[]>>(
    "get",
    "/api/v1/system/scheduled-jobs/cron/list"
  );

export const updateCronJobConfigApi = (
  name: string,
  data: UpdateCronJobConfigDto
) =>
  http.request<CommonResult<{ status: "ok" }>>(
    "post",
    `/api/v1/system/scheduled-jobs/cron/config/${encodeURIComponent(name)}`,
    { data }
  );

export const enableCronJobApi = (name: string) =>
  http.request<CommonResult<{ status: "ok" }>>(
    "post",
    `/api/v1/system/scheduled-jobs/cron/enable/${encodeURIComponent(name)}`
  );

export const disableCronJobApi = (name: string) =>
  http.request<CommonResult<{ status: "ok" }>>(
    "post",
    `/api/v1/system/scheduled-jobs/cron/disable/${encodeURIComponent(name)}`
  );

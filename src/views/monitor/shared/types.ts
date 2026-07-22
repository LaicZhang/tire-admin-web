export type MonitorCenterMode = "platform" | "company";

export type MonitorTabKey =
  | "overview"
  | "org"
  | "logs"
  | "business"
  | "system"
  | "money";

export const MONITOR_TAB_PERMS: Record<
  Exclude<MonitorTabKey, never>,
  string | null
> = {
  overview: "get/monitor/overview",
  org: "get/monitor/org",
  logs: "get/monitor/logs",
  business: "get/monitor/business",
  system: "get/monitor/system",
  money: "get/monitor/money"
};

export const MONITOR_EXPORT_PERM = "get/monitor/export";

import type {
  TraceWorkbenchIncidentType,
  TraceWorkbenchModule,
  TraceWorkbenchSeverity,
  TraceWorkbenchStatus
} from "@/api/dashboard";

export const TRACE_WORKBENCH_MODULE_OPTIONS: Array<{
  label: string;
  value: TraceWorkbenchModule;
}> = [
  { label: "销售", value: "sales" },
  { label: "采购", value: "purchase" },
  { label: "库存", value: "inventory" },
  { label: "财务", value: "finance" },
  { label: "回滚关注", value: "rollback" }
];

export const TRACE_WORKBENCH_INCIDENT_TYPE_OPTIONS: Array<{
  label: string;
  value: TraceWorkbenchIncidentType;
}> = [
  { label: "销售异常", value: "salesAnomaly" },
  { label: "采购异常", value: "purchaseAnomaly" },
  { label: "库存异常", value: "inventoryAnomaly" },
  { label: "财务异常", value: "financeAnomaly" },
  { label: "回滚关注项", value: "rollbackFocus" }
];

export const TRACE_WORKBENCH_STATUS_OPTIONS: Array<{
  label: string;
  value: TraceWorkbenchStatus;
}> = [
  { label: "待处理", value: "open" },
  { label: "排查中", value: "investigating" },
  { label: "建议回滚", value: "rollbackRecommended" },
  { label: "已解决", value: "resolved" }
];

const MODULE_LABELS: Record<TraceWorkbenchModule, string> = {
  sales: "销售",
  purchase: "采购",
  inventory: "库存",
  finance: "财务",
  rollback: "回滚关注"
};

const INCIDENT_TYPE_LABELS: Record<TraceWorkbenchIncidentType, string> = {
  salesAnomaly: "销售异常",
  purchaseAnomaly: "采购异常",
  inventoryAnomaly: "库存异常",
  financeAnomaly: "财务异常",
  rollbackFocus: "回滚关注项"
};

const STATUS_LABELS: Record<TraceWorkbenchStatus, string> = {
  open: "待处理",
  investigating: "排查中",
  rollbackRecommended: "建议回滚",
  resolved: "已解决"
};

const SEVERITY_LABELS: Record<TraceWorkbenchSeverity, string> = {
  info: "提示",
  warning: "预警",
  danger: "高危",
  success: "已解决"
};

const SEVERITY_TAG_TYPES: Record<
  TraceWorkbenchSeverity,
  "info" | "warning" | "danger" | "success"
> = {
  info: "info",
  warning: "warning",
  danger: "danger",
  success: "success"
};

const STATUS_TAG_TYPES: Record<
  TraceWorkbenchStatus,
  "info" | "warning" | "danger" | "success"
> = {
  open: "danger",
  investigating: "warning",
  rollbackRecommended: "warning",
  resolved: "success"
};

export function getTraceWorkbenchModuleLabel(module: TraceWorkbenchModule) {
  return MODULE_LABELS[module];
}

export function getTraceWorkbenchIncidentTypeLabel(
  incidentType: TraceWorkbenchIncidentType
) {
  return INCIDENT_TYPE_LABELS[incidentType];
}

export function getTraceWorkbenchStatusLabel(status: TraceWorkbenchStatus) {
  return STATUS_LABELS[status];
}

export function getTraceWorkbenchSeverityLabel(
  severity: TraceWorkbenchSeverity
) {
  return SEVERITY_LABELS[severity];
}

export function getTraceWorkbenchSeverityTagType(
  severity: TraceWorkbenchSeverity
) {
  return SEVERITY_TAG_TYPES[severity];
}

export function getTraceWorkbenchStatusTagType(status: TraceWorkbenchStatus) {
  return STATUS_TAG_TYPES[status];
}

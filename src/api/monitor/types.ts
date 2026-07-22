/** 监控中心共享类型（与 be-core monitor DTOs 对齐） */

export type MonitorTimeRangeQuery = {
  startDate?: string;
  endDate?: string;
  days?: number;
  companyId?: string;
};

export type MonitorPageQuery = MonitorTimeRangeQuery & {
  page?: number;
  pageSize?: number;
};

export type MonitorLogListQuery = MonitorPageQuery & {
  module?: string;
  method?: string;
  operator?: string;
  traceId?: string;
  ip?: string;
  success?: string | boolean;
  sensitive?: string | boolean;
};

export type MonitorLoginLogQuery = MonitorPageQuery & {
  operator?: string;
  ip?: string;
};

export type MonitorEmployeeQuery = MonitorPageQuery & {
  keyword?: string;
  activeDays?: number;
};

export type MonitorMoneyQuery = MonitorPageQuery & {
  entityType?: string;
  operationType?: string;
};

export type MonitorCronRunQuery = {
  page?: number;
  pageSize?: number;
  jobName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

export type MonitorExportTarget = "operation" | "login" | "money" | "sensitive";

export type MonitorExportQuery = MonitorLogListQuery & {
  target?: MonitorExportTarget;
};

export type MonitorKpi = {
  loginCount: number;
  operationCount: number;
  failureCount: number;
  failureRate: number;
  sensitiveCount: number;
  cronFailureCount: number;
  moneyEventCount: number;
  activeCompanyCount?: number;
};

export type MonitorDailyMetric = {
  date: string;
  loginCount: number;
  operationCount: number;
  failureCount: number;
  sensitiveCount: number;
  moneyEventCount: number;
};

export type MonitorCompanyRank = {
  companyId: string;
  companyName: string;
  operationCount: number;
  loginCount: number;
};

export type MonitorOverview = {
  kpi: MonitorKpi;
  daily: MonitorDailyMetric[];
  activeCompanies?: MonitorCompanyRank[];
};

export type MonitorBusinessSummary = {
  saleOrder: number;
  purchaseOrder: number;
  transferOrder: number;
  wasteOrder: number;
  surplusOrder: number;
  writeOffOrder: number;
  receiptOrder: number;
  paymentOrder: number;
};

export type MonitorOperationLogItem = {
  id: number;
  uid?: string | null;
  userId: string;
  username: string;
  companyId?: string | null;
  companyName?: string | null;
  module: string;
  method: string;
  path: string;
  ip: string;
  durationMs?: number | null;
  traceId?: string | null;
  success: boolean;
  sensitive: boolean;
  unscoped: boolean;
  createdAt: string;
  params?: string;
  result?: string;
};

export type MonitorLoginLogItem = {
  id: number;
  userId: string;
  username: string;
  companyId?: string | null;
  companyName?: string | null;
  ip: string;
  method?: number | null;
  createdAt: string;
};

export type MonitorCompanyCard = {
  uid: string;
  name: string;
  status?: string | null;
  employeeCount?: number;
  createAt?: string | null;
};

export type MonitorEmployeeItem = {
  uid: string;
  name?: string | null;
  nickname?: string | null;
  username?: string | null;
  companyId: string;
  companyName?: string | null;
  status?: string | boolean | null;
  operationCount: number;
  loginCount: number;
  activeDays: number;
};

export type MonitorMoneyEventItem = {
  uid: string;
  companyId: string;
  companyName?: string | null;
  entityType: string;
  entityId: string;
  operationType: string;
  operatorId?: string | null;
  operatorName?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  createdAt: string;
};

export type MonitorSensitiveItem = MonitorOperationLogItem & {
  snapshots?: Array<{
    uid: string;
    entityType?: string | null;
    entityId?: string | null;
    createdAt?: string | null;
  }>;
  reversals?: Array<{
    uid: string;
    reason?: string | null;
    createdAt?: string | null;
  }>;
};

export type MonitorCronRunItem = {
  id: number | string;
  jobName: string;
  status: string;
  startedAt: string;
  finishedAt?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
};

export type MonitorSystemHealth = {
  logQueue?: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null;
  recentCronFailures: MonitorCronRunItem[];
  backup: {
    recentCount: number;
    lastStatus?: string | null;
    lastCompletedAt?: string | null;
  };
  archive: {
    note: string;
  };
};

export type MonitorPaginated<T> = {
  list: T[];
  total: number;
};

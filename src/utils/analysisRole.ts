export type AnalysisRoleView =
  | "executive"
  | "sales"
  | "purchase"
  | "warehouse"
  | "finance"
  | "analyst";

export type AnalysisPageKey = "sales" | "purchase" | "inventory";

export type AnalysisSectionKey =
  | "summary"
  | "trend"
  | "tracking"
  | "ranking"
  | "evaluation"
  | "turnover"
  | "movement"
  | "slowMoving"
  | "stockout"
  | "expiry"
  | "dotAging";

export const ANALYSIS_ROUTE_ROLES = [
  "admin",
  "boss",
  "dataAnalyst",
  "dataAnalystManager",
  "seller",
  "sellerManager",
  "purchaser",
  "purchaserManager",
  "warehouseEmployee",
  "warehouseEmployeeManager",
  "warehouseManager",
  "financial",
  "finance",
  "financeManager",
  "accountant"
] as const;

export const SALES_ANALYSIS_ROLES = [
  "admin",
  "boss",
  "dataAnalyst",
  "dataAnalystManager",
  "seller",
  "sellerManager",
  "financial",
  "finance",
  "financeManager",
  "accountant"
] as const;

export const PURCHASE_ANALYSIS_ROLES = [
  "admin",
  "boss",
  "dataAnalyst",
  "dataAnalystManager",
  "purchaser",
  "purchaserManager",
  "financial",
  "finance",
  "financeManager",
  "accountant"
] as const;

export const INVENTORY_ANALYSIS_ROLES = [
  "admin",
  "boss",
  "dataAnalyst",
  "dataAnalystManager",
  "warehouseEmployee",
  "warehouseEmployeeManager",
  "warehouseManager"
] as const;

const EXECUTIVE_ROLES = new Set(["admin", "boss"]);
const ANALYST_ROLES = new Set(["dataAnalyst", "dataAnalystManager"]);
const SALES_ROLES = new Set(["seller", "sellerManager"]);
const PURCHASE_ROLES = new Set(["purchaser", "purchaserManager"]);
const WAREHOUSE_ROLES = new Set([
  "warehouseEmployee",
  "warehouseEmployeeManager",
  "warehouseManager"
]);
const FINANCE_ROLES = new Set([
  "financial",
  "finance",
  "financeManager",
  "accountant"
]);

export function canSelectAnalysisMember(roles: string[]): boolean {
  return roles.some(role => EXECUTIVE_ROLES.has(role));
}

export function resolveAnalysisRoleView(roles: string[]): AnalysisRoleView {
  if (roles.some(role => ANALYST_ROLES.has(role))) return "analyst";
  if (roles.some(role => EXECUTIVE_ROLES.has(role))) return "executive";
  if (roles.some(role => SALES_ROLES.has(role))) return "sales";
  if (roles.some(role => PURCHASE_ROLES.has(role))) return "purchase";
  if (roles.some(role => WAREHOUSE_ROLES.has(role))) return "warehouse";
  if (roles.some(role => FINANCE_ROLES.has(role))) return "finance";
  return "executive";
}

export function getAnalysisSectionOrder(
  page: AnalysisPageKey,
  roleView: AnalysisRoleView
): AnalysisSectionKey[] {
  if (page === "sales") return getSalesSectionOrder(roleView);
  if (page === "purchase") return getPurchaseSectionOrder(roleView);
  return getInventorySectionOrder(roleView);
}

function getSalesSectionOrder(
  roleView: AnalysisRoleView
): AnalysisSectionKey[] {
  if (roleView === "sales") {
    return ["summary", "tracking", "trend", "ranking"];
  }
  if (roleView === "finance") {
    return ["summary", "trend", "tracking"];
  }
  return ["summary", "trend", "ranking", "tracking"];
}

function getPurchaseSectionOrder(
  roleView: AnalysisRoleView
): AnalysisSectionKey[] {
  if (roleView === "purchase") {
    return ["summary", "tracking", "trend", "ranking", "evaluation"];
  }
  if (roleView === "finance") {
    return ["summary", "tracking", "trend", "evaluation"];
  }
  return ["summary", "trend", "ranking", "tracking", "evaluation"];
}

function getInventorySectionOrder(
  roleView: AnalysisRoleView
): AnalysisSectionKey[] {
  if (roleView === "warehouse") {
    return [
      "summary",
      "movement",
      "stockout",
      "slowMoving",
      "expiry",
      "dotAging",
      "turnover"
    ];
  }
  if (roleView === "finance") {
    return ["summary", "movement", "turnover"];
  }
  return [
    "summary",
    "turnover",
    "movement",
    "slowMoving",
    "stockout",
    "expiry",
    "dotAging"
  ];
}

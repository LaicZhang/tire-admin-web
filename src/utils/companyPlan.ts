/** W133: company subscription plan display helpers (no purchase). */

import type { CompanyPlanCurrent, SubscriptionPlanCode } from "@/api/system/subscription";

export const PLAN_CODE_LABELS: Record<SubscriptionPlanCode, string> = {
  FREE: "免费计划",
  PREMIUM: "高级计划",
  BUYOUT: "买断计划"
};

/** Distinguish 免费计划 vs 免费账套导入 (import free is unrelated). */
export function planCodeLabel(code: SubscriptionPlanCode | string | null | undefined): string {
  if (!code) return "—";
  if (code in PLAN_CODE_LABELS) {
    return PLAN_CODE_LABELS[code as SubscriptionPlanCode];
  }
  return String(code);
}

export function formatFeatureKeysSummary(keys: string[] | null | undefined, max = 8): string {
  const list = (keys ?? []).filter(Boolean);
  if (list.length === 0) return "无功能点";
  if (list.length <= max) return list.join("、");
  return `${list.slice(0, max).join("、")} 等 ${list.length} 项`;
}

export function formatPlanEndsAt(endsAt: string | null | undefined): string {
  if (!endsAt) return "不限期";
  const d = new Date(endsAt);
  if (Number.isNaN(d.getTime())) return String(endsAt);
  return d.toLocaleString("zh-CN", { hour12: false });
}

export function isAdminOrBossRole(roles: readonly string[] | null | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some(r => {
    const n = String(r).trim().toLowerCase();
    return n === "admin" || n === "boss";
  });
}

export type RedeemFailureKind =
  | "empty"
  | "not_found"
  | "expired"
  | "exhausted"
  | "bound_mismatch"
  | "unavailable"
  | "forbidden"
  | "unknown";

/** Map backend msg / client state to a readable Boss-facing reason. */
export function classifyRedeemFailure(message: string | null | undefined): RedeemFailureKind {
  const msg = (message ?? "").trim();
  if (!msg) return "unknown";
  if (/不能为空|请输入/.test(msg)) return "empty";
  if (/不存在/.test(msg)) return "not_found";
  if (/已过期|过期/.test(msg)) return "expired";
  if (/已用尽|用尽|EXHAUSTED/i.test(msg)) return "exhausted";
  if (/不适用于|绑定|当前公司/.test(msg)) return "bound_mismatch";
  if (/不可用|已作废|REVOKED/i.test(msg)) return "unavailable";
  if (/权限|Boss|管理员|禁止|拒绝|403/.test(msg)) return "forbidden";
  return "unknown";
}

export function redeemFailureCopy(kind: RedeemFailureKind, fallback?: string): string {
  switch (kind) {
    case "empty":
      return "请输入兑换码";
    case "not_found":
      return "兑换码不存在，请核对后重试";
    case "expired":
      return "兑换码已过期";
    case "exhausted":
      return "兑换码已用尽（不可再次兑换）";
    case "bound_mismatch":
      return "兑换码不适用于当前公司";
    case "unavailable":
      return "兑换码不可用（可能已作废）";
    case "forbidden":
      return "仅公司 Boss 或平台管理员可兑换";
    default:
      return fallback?.trim() || "兑换失败，请稍后重试";
  }
}

export function summarizeCompanyPlan(plan: CompanyPlanCurrent | null | undefined): {
  planLabel: string;
  features: string;
  endsAt: string;
  receivesUpdates: string;
} {
  if (!plan) {
    return {
      planLabel: "—",
      features: "—",
      endsAt: "—",
      receivesUpdates: "—"
    };
  }
  return {
    planLabel: planCodeLabel(plan.planCode),
    features: formatFeatureKeysSummary(plan.featureKeys),
    endsAt: formatPlanEndsAt(plan.endsAt),
    receivesUpdates: plan.receivesUpdates ? "跟随功能更新" : "买断快照（不跟随更新）"
  };
}

import type { Ref } from "vue";
import { ORDER_TYPE } from "@/utils";

type DetailLike = Record<string, unknown>;

function asRecord(value: unknown): DetailLike {
  return value && typeof value === "object" ? (value as DetailLike) : {};
}

export function toFiniteNumber(value: unknown): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

export function resolveClaimLineAmount(detail: DetailLike): number {
  return (
    toFiniteNumber(detail.claimFee) +
    toFiniteNumber(detail.wearFee) +
    toFiniteNumber(detail.claimTirePrice)
  );
}

export function computeOrderFormSummary(params: {
  orderType: ORDER_TYPE | string;
  details: unknown[];
  formTitle: string;
}): { count: number; showTotal: number; total: number } {
  const details = params.details;
  const count =
    params.orderType === ORDER_TYPE.supplierClaim
      ? details.length
      : details.reduce(
          (sum: number, detail) => sum + toFiniteNumber(asRecord(detail).count),
          0
        );
  const showTotal = details.reduce((sum: number, detail) => {
    const row = asRecord(detail);
    if (params.orderType === ORDER_TYPE.claim)
      return sum + resolveClaimLineAmount(row);
    if (params.orderType === ORDER_TYPE.supplierClaim)
      return sum + toFiniteNumber(row.claimAmount);
    if ("total" in row) return sum + toFiniteNumber(row.total);
    return sum + toFiniteNumber(row.count) * toFiniteNumber(row.unitPrice);
  }, 0);
  const settledTotal =
    params.orderType === ORDER_TYPE.supplierClaim
      ? details.reduce(
          (sum: number, detail) =>
            sum + toFiniteNumber(asRecord(detail).settledAmount),
          0
        )
      : showTotal;

  let total = showTotal;
  if (params.orderType === ORDER_TYPE.supplierClaim) {
    total = settledTotal;
  } else if (!["新增", "修改"].includes(params.formTitle)) {
    // keep existing total when not in create/edit title modes is handled by caller
    total = showTotal;
  }
  if (params.orderType === ORDER_TYPE.supplierClaim) {
    return { count, showTotal, total: settledTotal };
  }
  if (["新增", "修改"].includes(params.formTitle)) {
    return { count, showTotal, total: showTotal };
  }
  return { count, showTotal, total };
}

/**
 * UI-002：从 business/order/form.vue 抽出明细汇总逻辑，保持 API/路由不变。
 */
export function applyOrderFormSummary(params: {
  orderType: ORDER_TYPE | string;
  details: unknown[];
  formTitle: string;
  target: Ref<{ count?: number; showTotal?: number; total?: number }>;
}): void {
  const summary = computeOrderFormSummary(params);
  params.target.value.count = summary.count;
  params.target.value.showTotal = summary.showTotal;
  if (params.orderType === ORDER_TYPE.supplierClaim) {
    params.target.value.total = summary.total;
    return;
  }
  if (["新增", "修改"].includes(params.formTitle)) {
    params.target.value.total = summary.total;
  }
}

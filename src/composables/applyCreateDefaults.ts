import {
  loadInventoryDefaults,
  type InventoryDefaults
} from "./useInventoryDefaults";
import {
  loadSettlementDefaults,
  type SettlementDefaults
} from "./useSettlementDefaults";
import { logger } from "@/utils/logger";

export type SettlementAccountKind = "receivable" | "payable" | "transferFrom";

export type ApplyCreateDefaultsOptions = {
  /** When false, no fields are written (edit/view). */
  isCreate: boolean;
  /** Prefill header repoId / stocktaking warehouse. */
  warehouse?: boolean;
  /** Prefill transfer from-warehouse only. */
  transferFromWarehouse?: boolean;
  /** Prefill assembly target warehouse. */
  targetWarehouse?: boolean;
  /** Prefill disassembly source warehouse. */
  sourceWarehouse?: boolean;
  /** Prefill empty detail.repoId rows. */
  detailWarehouse?: boolean;
  /** Prefill empty component.repoId rows. */
  componentWarehouse?: boolean;
  /** Prefill settlement account / method. */
  settlement?: SettlementAccountKind | false;
};

export type CreateDefaultsTarget = {
  repoId?: string | null;
  fromRepositoryId?: string | null;
  targetRepoId?: string | null;
  sourceRepoId?: string | null;
  paymentId?: string | null;
  fromPaymentId?: string | null;
  paymentMethod?: string | null;
  details?: Array<{ repoId?: string | null }>;
  components?: Array<{ repoId?: string | null }>;
};

export type AppliedCreateDefaults = {
  inventory: InventoryDefaults;
  settlement: SettlementDefaults;
};

function isBlank(value: string | null | undefined): boolean {
  return value == null || String(value).trim().length === 0;
}

function fillIfBlank(
  current: string | null | undefined,
  next: string | undefined
): string | undefined {
  if (!isBlank(current)) {
    return current == null ? undefined : String(current);
  }
  if (!next || isBlank(next)) {
    return current == null ? undefined : String(current);
  }
  return next;
}

/**
 * Merge company inventory/settlement defaults into an empty create form.
 * Never overwrites non-empty fields. Swallows load errors (logs only).
 */
export async function applyCreateDefaults(
  target: CreateDefaultsTarget,
  options: ApplyCreateDefaultsOptions
): Promise<AppliedCreateDefaults | null> {
  if (!options.isCreate) {
    return null;
  }

  const needInventory =
    options.warehouse ||
    options.transferFromWarehouse ||
    options.targetWarehouse ||
    options.sourceWarehouse ||
    options.detailWarehouse ||
    options.componentWarehouse;
  const needSettlement = Boolean(options.settlement);

  let inventory: InventoryDefaults = {};
  let settlement: SettlementDefaults = { allowBackdateDays: 0 };

  try {
    if (needInventory) {
      inventory = await loadInventoryDefaults();
    }
  } catch (error) {
    logger.error("[CreateDefaults] inventory load failed", error);
  }

  try {
    if (needSettlement) {
      settlement = await loadSettlementDefaults();
    }
  } catch (error) {
    logger.error("[CreateDefaults] settlement load failed", error);
  }

  const warehouseId = inventory.defaultWarehouseId;

  if (options.warehouse && "repoId" in target) {
    const next = fillIfBlank(target.repoId, warehouseId);
    if (next !== undefined) target.repoId = next;
  }

  if (options.transferFromWarehouse && "fromRepositoryId" in target) {
    const next = fillIfBlank(target.fromRepositoryId, warehouseId);
    if (next !== undefined) target.fromRepositoryId = next;
  }

  if (options.targetWarehouse && "targetRepoId" in target) {
    const next = fillIfBlank(target.targetRepoId, warehouseId);
    if (next !== undefined) target.targetRepoId = next;
  }

  if (options.sourceWarehouse && "sourceRepoId" in target) {
    const next = fillIfBlank(target.sourceRepoId, warehouseId);
    if (next !== undefined) target.sourceRepoId = next;
  }

  if (options.detailWarehouse && Array.isArray(target.details) && warehouseId) {
    for (const row of target.details) {
      if (isBlank(row.repoId)) {
        row.repoId = warehouseId;
      }
    }
  }

  if (
    options.componentWarehouse &&
    Array.isArray(target.components) &&
    warehouseId
  ) {
    for (const row of target.components) {
      if (isBlank(row.repoId)) {
        row.repoId = warehouseId;
      }
    }
  }

  if (options.settlement === "receivable") {
    if ("paymentId" in target) {
      const next = fillIfBlank(
        target.paymentId,
        settlement.defaultReceivableAccount
      );
      if (next !== undefined) target.paymentId = next;
    }
    if ("paymentMethod" in target && settlement.defaultPaymentMethod) {
      if (isBlank(target.paymentMethod)) {
        target.paymentMethod = settlement.defaultPaymentMethod;
      }
    }
  }

  if (options.settlement === "payable") {
    if ("paymentId" in target) {
      const next = fillIfBlank(
        target.paymentId,
        settlement.defaultPayableAccount
      );
      if (next !== undefined) target.paymentId = next;
    }
    if ("paymentMethod" in target && settlement.defaultPaymentMethod) {
      if (isBlank(target.paymentMethod)) {
        target.paymentMethod = settlement.defaultPaymentMethod;
      }
    }
  }

  if (options.settlement === "transferFrom" && "fromPaymentId" in target) {
    const account =
      settlement.defaultPayableAccount || settlement.defaultReceivableAccount;
    const next = fillIfBlank(target.fromPaymentId, account);
    if (next !== undefined) target.fromPaymentId = next;
  }

  return { inventory, settlement };
}

/**
 * Returns true when `date` should be disabled for document backdating.
 * allowBackdateDays=0 → only today; N → today and previous N days.
 * Future dates are always disabled.
 */
export function isDateOutsideBackdateWindow(
  date: Date,
  allowBackdateDays: number,
  now: Date = new Date()
): boolean {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const dateDay = startOf(date);
  const today = startOf(now);
  if (dateDay > today) return true;
  const days = Number.isFinite(allowBackdateDays)
    ? Math.max(0, Math.floor(allowBackdateDays))
    : 0;
  const earliest = today - days * dayMs;
  return dateDay < earliest;
}

export function createBackdateDisabledDate(
  getAllowBackdateDays: () => number
): (date: Date) => boolean {
  return (date: Date) =>
    isDateOutsideBackdateWindow(date, getAllowBackdateDays());
}

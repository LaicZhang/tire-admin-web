import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export type BalanceAdjustmentType =
  | "WRITE_OFF_BAD_DEBT"
  | "WRITE_OFF_OFFSET"
  | "INITIAL_BALANCE"
  | "MANUAL_ADJUSTMENT"
  | "REVERSAL";

export type BalanceAdjustmentSourceType =
  | "WRITE_OFF_ORDER"
  | "INITIAL_BALANCE"
  | "MANUAL";

export interface BalanceAdjustment {
  id: number;
  uid: string;
  companyId: string;
  customerId?: string | null;
  providerId?: string | null;
  type: BalanceAdjustmentType;
  sourceType: BalanceAdjustmentSourceType;
  sourceId?: string | null;
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  remark?: string | null;
  isReversed: boolean;
  reversedAt?: string | null;
  reversedBy?: string | null;
  createAt: string;
}

export async function createManualBalanceAdjustmentApi(data: {
  customerId?: string;
  providerId?: string;
  amount: number;
  remark?: string;
}) {
  return await http.request<CommonResult<BalanceAdjustment>>(
    "post",
    baseUrlApi("/balance-adjustment/manual"),
    { data }
  );
}

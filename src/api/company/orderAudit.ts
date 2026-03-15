import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export type OrderAuditMode = "boss_required" | "dept_manager_only";

export type OrderAuditOrderType =
  | "sale-order"
  | "purchase-order"
  | "return-order"
  | "claim-order"
  | "transfer-order"
  | "waste-order"
  | "surplus-order"
  | "assembly-order";

export type OrderAuditTypeConfig = {
  enabled: boolean;
  approvalsRequired: number;
  mode: OrderAuditMode;
};

export type OrderAuditConfig = Record<
  OrderAuditOrderType,
  OrderAuditTypeConfig
>;

export type OrderAuditConfigResponseDto = {
  config: OrderAuditConfig;
};

export function getOrderAuditConfigApi() {
  return http.request<CommonResult<OrderAuditConfigResponseDto>>(
    "get",
    baseUrlApi("/audit/config")
  );
}

export function updateOrderAuditConfigApi(config: OrderAuditConfig) {
  return http.request<CommonResult<OrderAuditConfigResponseDto>>(
    "post",
    baseUrlApi("/audit/config"),
    {
      data: { config }
    }
  );
}

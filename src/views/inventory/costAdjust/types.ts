// 成本调整单类型定义 (重新组织inventory模块)
import type {
  CostAdjustOrder as BaseCostAdjustOrder,
  CostAdjustOrderDetail as BaseCostAdjustOrderDetail
} from "@/api/business/costAdjust";

export type CostAdjustOrderDetail = BaseCostAdjustOrderDetail;
export type CostAdjustOrder = BaseCostAdjustOrder;

export enum CostAdjustStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export const costAdjustStatusMap: Record<
  string,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  pending: { label: "待审核", type: "warning" },
  approved: { label: "已审核", type: "success" },
  rejected: { label: "已拒绝", type: "danger" }
};

export interface CreateCostAdjustDetailDto {
  _uid?: string; // 表单内部唯一标识，用于 v-for :key
  repoId: string;
  tireId: string;
  originalCost: number;
  adjustedCost: number;
  count: number;
  remark?: string;
}

export interface CreateCostAdjustOrderDto {
  operatorId: string;
  auditorId: string;
  reason?: string;
  desc?: string;
  details: CreateCostAdjustDetailDto[];
}

export type UpdateCostAdjustOrderDto = Partial<CreateCostAdjustOrderDto>;

export interface CostAdjustQuery {
  isApproved?: boolean | "all";
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

import { http } from "@/utils/http";

export interface CostAdjustOrderDetail {
  id?: number;
  repoId: string;
  tireId: string;
  originalCost: number;
  adjustedCost: number;
  count: number;
  remark?: string;
  tire?: {
    name: string;
    barcode?: string;
  };
  repo?: {
    name: string;
  };
}

export interface CostAdjustOrder {
  id: number;
  uid: string;
  number: bigint;
  reason?: string;
  desc?: string;
  isApproved: boolean;
  isLocked: boolean;
  totalAdjustAmount: bigint;
  createAt: string;
  auditAt?: string;
  details: CostAdjustOrderDetail[];
  operator?: {
    name: string;
  };
  auditor?: {
    name: string;
  };
}

export interface CreateCostAdjustOrderDto {
  operatorId: string;
  auditorId: string;
  reason?: string;
  desc?: string;
  details: Omit<CostAdjustOrderDetail, "id" | "tire" | "repo">[];
}

export type UpdateCostAdjustOrderDto = Partial<CreateCostAdjustOrderDto>;

// 创建成本调整单
export const createCostAdjustOrder = (data: CreateCostAdjustOrderDto) => {
  return http.post<CreateCostAdjustOrderDto, CostAdjustOrder>(
    "/cost-adjust-order",
    { data }
  );
};

// 查询成本调整单列表
export const getCostAdjustOrderList = (params?: {
  index?: number;
  isApproved?: boolean;
}) => {
  return http.get<void, { count: number; list: CostAdjustOrder[] }>(
    "/cost-adjust-order",
    {
      params
    }
  );
};

// 获取成本调整单详情
export const getCostAdjustOrderDetail = (id: number) => {
  return http.get<void, CostAdjustOrder>(`/cost-adjust-order/${id}`);
};

// 更新成本调整单
export const updateCostAdjustOrder = (
  id: number,
  data: UpdateCostAdjustOrderDto
) => {
  return http.patch<UpdateCostAdjustOrderDto, CostAdjustOrder>(
    `/cost-adjust-order/${id}`,
    { data }
  );
};

// 审核成本调整单
export const approveCostAdjustOrder = (id: number) => {
  return http.post<void, CostAdjustOrder>(`/cost-adjust-order/${id}/approve`);
};

// 拒绝成本调整单
export const rejectCostAdjustOrder = (id: number, reason: string) => {
  return http.post<{ reason: string }, CostAdjustOrder>(
    `/cost-adjust-order/${id}/reject`,
    {
      data: { reason }
    }
  );
};

// 删除成本调整单
export const deleteCostAdjustOrder = (id: number) => {
  return http.delete<void, void>(`/cost-adjust-order/${id}`);
};

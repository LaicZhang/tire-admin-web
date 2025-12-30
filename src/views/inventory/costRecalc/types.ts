// 成本重算类型定义

export enum RecalcScope {
  SINGLE = "single",
  CATEGORY = "category",
  ALL = "all"
}

export const recalcScopeMap: Record<
  RecalcScope,
  { label: string; desc: string }
> = {
  [RecalcScope.SINGLE]: { label: "单个商品", desc: "仅对指定商品重算成本" },
  [RecalcScope.CATEGORY]: {
    label: "整个类别",
    desc: "对指定类别所有商品重算成本"
  },
  [RecalcScope.ALL]: { label: "所有商品", desc: "对全部商品重算成本" }
};

export enum RecalcStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed"
}

export const recalcStatusMap: Record<
  RecalcStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [RecalcStatus.PENDING]: { label: "待执行", type: "info" },
  [RecalcStatus.PROCESSING]: { label: "执行中", type: "warning" },
  [RecalcStatus.COMPLETED]: { label: "已完成", type: "success" },
  [RecalcStatus.FAILED]: { label: "失败", type: "danger" }
};

export interface CostRecalcTask {
  id: number;
  uid: string;
  scope: RecalcScope;
  tireId?: string;
  tireName?: string;
  categoryId?: string;
  categoryName?: string;
  status: RecalcStatus;
  progress: number;
  totalItems: number;
  processedItems: number;
  startDate?: string;
  endDate?: string;
  operatorId?: string;
  operatorName?: string;
  backupId?: string;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  remark?: string;
}

export interface CreateRecalcTaskDto {
  scope: RecalcScope;
  tireId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  remark?: string;
}

export interface RecalcTaskQuery {
  status?: RecalcStatus;
  startDate?: string;
  endDate?: string;
}

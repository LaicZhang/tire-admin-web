// 盘点单类型定义

export enum StocktakingStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export const stocktakingStatusMap: Record<
  StocktakingStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [StocktakingStatus.IN_PROGRESS]: { label: "进行中", type: "warning" },
  [StocktakingStatus.COMPLETED]: { label: "已完成", type: "success" },
  [StocktakingStatus.CANCELLED]: { label: "已取消", type: "info" }
};

export interface StocktakingDetail {
  id: number;
  taskId: number;
  tireId: string;
  tireName?: string;
  tireBarcode?: string;
  bookCount: number;
  actualCount?: number;
  difference?: number;
  remark?: string;
}

export interface StocktakingTask {
  id: number;
  uid: string;
  companyId: string;
  repoId: string;
  repoName?: string;
  name?: string;
  status: StocktakingStatus;
  startedAt: string;
  completedAt?: string;
  createdBy: string;
  creatorName?: string;
  remark?: string;
  createdAt: string;
  repo?: {
    uid: string;
    name: string;
  };
  details?: StocktakingDetail[];
}

export interface CreateStocktakingDto {
  repoId: string;
  name?: string;
  tireIds?: string[];
  includeZeroStock?: boolean;
  remark?: string;
}

export interface UpdateStocktakingDetailDto {
  details: {
    detailId: number;
    actualCount: number;
    remark?: string;
  }[];
}

export interface StocktakingQuery {
  status?: StocktakingStatus;
  repoId?: string;
  startDate?: string;
  endDate?: string;
}

export interface StocktakingResult {
  task: StocktakingTask;
  surplusOrderId?: string;
  wasteOrderId?: string;
}

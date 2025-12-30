// 组装单类型定义

export enum AssemblyOrderStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed"
}

export const assemblyOrderStatusMap: Record<
  AssemblyOrderStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [AssemblyOrderStatus.DRAFT]: { label: "草稿", type: "info" },
  [AssemblyOrderStatus.PENDING]: { label: "待审核", type: "warning" },
  [AssemblyOrderStatus.APPROVED]: { label: "已审核", type: "success" },
  [AssemblyOrderStatus.REJECTED]: { label: "已拒绝", type: "danger" },
  [AssemblyOrderStatus.COMPLETED]: { label: "已完成", type: "success" }
};

export interface AssemblyComponent {
  id?: number;
  tireId: string;
  tireName?: string;
  tireBarcode?: string;
  repoId?: string;
  repoName?: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  remark?: string;
}

export interface AssemblyOrder {
  id: number;
  uid: string;
  orderNumber?: string;
  targetTireId: string;
  targetTireName?: string;
  targetTireBarcode?: string;
  targetRepoId?: string;
  targetRepoName?: string;
  quantity: number;
  assemblyFee: number;
  totalCost?: number;
  status: AssemblyOrderStatus;
  isApproved: boolean;
  isLocked: boolean;
  operatorId?: string;
  operatorName?: string;
  auditorId?: string;
  auditorName?: string;
  orderDate?: string;
  bomId?: string;
  remark?: string;
  components: AssemblyComponent[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAssemblyOrderDto {
  targetTireId: string;
  targetRepoId: string;
  quantity: number;
  assemblyFee?: number;
  orderDate?: string;
  bomId?: string;
  remark?: string;
  components: Omit<
    AssemblyComponent,
    "id" | "tireName" | "tireBarcode" | "repoName" | "totalCost"
  >[];
}

export type UpdateAssemblyOrderDto = Partial<CreateAssemblyOrderDto>;

export interface AssemblyOrderQuery {
  status?: AssemblyOrderStatus;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

// 物流模块类型定义

// ============ 物流单 ============
export interface LogisticOrder {
  uid: string;
  type: string;
  logisticsStatus: number;
  isArrival: boolean;
  departureAt?: string;
  arrivalAt?: string;
  trackingNo?: string;
}

// ============ 发运计划 ============
export interface ShippingPlan {
  uid: string;
  name: string;
  plannedDate: string;
  status: ShippingPlanStatus;
  orderCount: number;
  orders?: string[];
  remark?: string;
  createdAt: string;
}

export enum ShippingPlanStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export const shippingPlanStatusMap: Record<
  ShippingPlanStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [ShippingPlanStatus.PENDING]: { label: "待执行", type: "info" },
  [ShippingPlanStatus.IN_PROGRESS]: { label: "执行中", type: "warning" },
  [ShippingPlanStatus.COMPLETED]: { label: "已完成", type: "success" },
  [ShippingPlanStatus.CANCELLED]: { label: "已取消", type: "danger" }
};

// ============ 装车任务 ============
export interface LoadingTask {
  uid: string;
  name?: string;
  vehicleNo: string;
  driverName?: string;
  driverPhone?: string;
  loadingTime?: string;
  status: LoadingTaskStatus;
  orders?: string[];
  planUid?: string;
  createdAt: string;
}

export enum LoadingTaskStatus {
  PENDING = "pending",
  LOADING = "loading",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export const loadingTaskStatusMap: Record<
  LoadingTaskStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [LoadingTaskStatus.PENDING]: { label: "待装车", type: "info" },
  [LoadingTaskStatus.LOADING]: { label: "装车中", type: "warning" },
  [LoadingTaskStatus.COMPLETED]: { label: "已完成", type: "success" },
  [LoadingTaskStatus.CANCELLED]: { label: "已取消", type: "danger" }
};

// ============ 发货波次 ============
export interface ShippingWave {
  uid: string;
  name: string;
  shippingDate: string;
  warehouseUid?: string;
  warehouseName?: string;
  orderCount: number;
  status: ShippingWaveStatus;
  orders?: string[];
  createdAt: string;
}

export enum ShippingWaveStatus {
  PENDING = "pending",
  SHIPPED = "shipped",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export const shippingWaveStatusMap: Record<
  ShippingWaveStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [ShippingWaveStatus.PENDING]: { label: "待发货", type: "info" },
  [ShippingWaveStatus.SHIPPED]: { label: "已发货", type: "warning" },
  [ShippingWaveStatus.COMPLETED]: { label: "已完成", type: "success" },
  [ShippingWaveStatus.CANCELLED]: { label: "已取消", type: "danger" }
};

// ============ 物流跟踪 ============
export interface TrackingNode {
  id?: string;
  time: string;
  location: string;
  description: string;
}

export interface TrackingInfo {
  carrier?: string;
  trackingNo: string;
  status: string;
  nodes: TrackingNode[];
}

// ============ 签收回执 ============
export interface DeliveryReceipt {
  uid: string;
  logisticUid: string;
  receiverName: string;
  signedAt: string;
  images?: string[];
  remark?: string;
  createdAt: string;
}

// ============ 配送异常 ============
export enum DeliveryExceptionType {
  DAMAGE = "damage",
  LOST = "lost",
  DELAY = "delay",
  REJECT = "reject",
  OTHER = "other"
}

export const deliveryExceptionTypeMap: Record<
  DeliveryExceptionType,
  { label: string; color: string }
> = {
  [DeliveryExceptionType.DAMAGE]: { label: "破损", color: "#E6A23C" },
  [DeliveryExceptionType.LOST]: { label: "丢失", color: "#F56C6C" },
  [DeliveryExceptionType.DELAY]: { label: "延误", color: "#909399" },
  [DeliveryExceptionType.REJECT]: { label: "拒收", color: "#F56C6C" },
  [DeliveryExceptionType.OTHER]: { label: "其他", color: "#909399" }
};

export interface DeliveryException {
  uid: string;
  logisticUid: string;
  type: DeliveryExceptionType;
  description: string;
  images?: string[];
  suggestion?: string;
  createdAt: string;
  id?: string;
  hash?: string;
  ext?: string;
}

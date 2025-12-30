import type {
  SerialNumber,
  SerialNumberStatus
} from "@/api/business/serialNumber";

/** 批次信息 */
export interface Batch {
  id: number;
  uid: string;
  /** 批次号 */
  batchNo: string;
  /** 商品ID */
  tireId: string;
  /** 商品名称 */
  tireName?: string;
  /** 仓库ID */
  repoId: string;
  /** 仓库名称 */
  repoName?: string;
  /** 数量 */
  quantity: number;
  /** 生产日期 */
  productionDate?: string;
  /** 到期日期 */
  expiryDate?: string;
  /** 保质期天数 */
  shelfLife?: number;
  /** 创建时间 */
  createdAt?: string;
}

/** 批次查询参数 */
export interface BatchQuery {
  tireId?: string;
  repoId?: string;
  batchNo?: string;
  keyword?: string;
}

/** 批次表单 */
export interface BatchForm {
  id?: number;
  uid?: string;
  batchNo: string;
  tireId: string;
  repoId: string;
  quantity: number;
  productionDate?: string;
  expiryDate?: string;
}

/** 序列号查询参数 */
export interface SerialNumberQuery {
  tireId?: string;
  repoId?: string;
  status?: SerialNumberStatus;
  keyword?: string;
}

/** 序列号表单 */
export interface SerialNumberForm {
  serialNo: string;
  tireId: string;
  repoId: string;
  batchNo?: string;
  productionDate?: string;
  expiryDate?: string;
}

/** 批量创建序列号表单 */
export interface BatchCreateSerialForm {
  tireId: string;
  repoId: string;
  prefix?: string;
  startNo: number;
  count: number;
  batchNo?: string;
}

export type { SerialNumber, SerialNumberStatus };

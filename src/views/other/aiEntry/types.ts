// AI录单模块类型定义

/** 上传方式 */
export enum UploadMethod {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file"
}

/** 图片类型 */
export enum ImageType {
  PRINTED = "printed", // 打印单据
  HANDWRITTEN = "handwritten" // 手写单/聊天截图
}

/** 上传文件信息 */
export interface UploadedFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: "ready" | "uploading" | "success" | "error";
  raw?: File;
}

/** AI识别的商品信息 */
export interface RecognizedProduct {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  price?: number;
  spec?: string;
  matchStatus: "matched" | "new" | "unmatched";
  matchedProductUid?: string;
  matchedProductName?: string;
  confidence: number; // 0-100
}

/** AI识别的往来单位信息 */
export interface RecognizedParty {
  name: string;
  type: "customer" | "supplier";
  matchStatus: "matched" | "new" | "unmatched";
  matchedUid?: string;
  matchedName?: string;
}

/** AI识别结果 */
export interface AIRecognitionResult {
  success: boolean;
  party?: RecognizedParty;
  products: RecognizedProduct[];
  totalAmount?: number;
  remark?: string;
  rawText?: string;
  confidence: number; // 0-100 整体置信度
}

/** 单据类型 */
export enum DocumentType {
  PURCHASE_ORDER = "purchase-order",
  PURCHASE_INBOUND = "purchase-inbound",
  PURCHASE_RETURN = "purchase-return",
  SALE_ORDER = "sale-order",
  SALE_OUTBOUND = "sale-outbound",
  SALE_RETURN = "sale-return"
}

/** 单据类型配置 */
export const documentTypeConfig: Record<
  DocumentType,
  { label: string; partyType: "customer" | "supplier"; partyLabel: string }
> = {
  [DocumentType.PURCHASE_ORDER]: {
    label: "采购订单",
    partyType: "supplier",
    partyLabel: "供应商"
  },
  [DocumentType.PURCHASE_INBOUND]: {
    label: "采购入库单",
    partyType: "supplier",
    partyLabel: "供应商"
  },
  [DocumentType.PURCHASE_RETURN]: {
    label: "采购退货单",
    partyType: "supplier",
    partyLabel: "供应商"
  },
  [DocumentType.SALE_ORDER]: {
    label: "销售订单",
    partyType: "customer",
    partyLabel: "客户"
  },
  [DocumentType.SALE_OUTBOUND]: {
    label: "销售出库单",
    partyType: "customer",
    partyLabel: "客户"
  },
  [DocumentType.SALE_RETURN]: {
    label: "销售退货单",
    partyType: "customer",
    partyLabel: "客户"
  }
};

/** 订单明细行 */
export interface OrderDetailRow {
  id: string;
  productUid?: string;
  productName: string;
  productSpec?: string;
  quantity: number;
  unit?: string;
  price?: number;
  amount?: number;
  warehouseUid?: string;
  warehouseName?: string;
  remark?: string;
  isNew: boolean; // 是否为新增商品
}

/** 订单表单数据 */
export interface OrderFormData {
  documentType: DocumentType;
  partyUid?: string;
  partyName?: string;
  warehouseUid?: string;
  warehouseName?: string;
  orderDate: string;
  details: OrderDetailRow[];
  totalAmount: number;
  remark?: string;
}

/** 历史记录项 */
export interface HistoryRecord {
  id: string;
  timestamp: string;
  method: UploadMethod;
  documentType: DocumentType;
  summary: string;
  success: boolean;
  resultOrderUid?: string;
}

/** AI录单状态 */
export enum AIEntryStatus {
  IDLE = "idle",
  UPLOADING = "uploading",
  RECOGNIZING = "recognizing",
  EDITING = "editing",
  SUBMITTING = "submitting",
  SUCCESS = "success",
  ERROR = "error"
}

/** 匹配状态标签配置 */
export const matchStatusConfig: Record<
  "matched" | "new" | "unmatched",
  { label: string; type: "success" | "warning" | "danger" }
> = {
  matched: { label: "已匹配", type: "success" },
  new: { label: "新增", type: "warning" },
  unmatched: { label: "未匹配", type: "danger" }
};

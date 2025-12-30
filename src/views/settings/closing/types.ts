// 结账与反结账 - 类型定义
export interface ClosingRecord {
  uid: string;
  closingDate: string;
  operatorId: string;
  operatorName: string;
  operationDate: string;
  status: "closed" | "unclosed";
  remark: string;
}

export interface ClosingCheckItem {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  errorMessage?: string;
}

// 操作日志 - 类型定义
export interface OperationLog {
  uid: string;
  userId: string;
  username: string;
  operationType: string;
  operationTypeName: string;
  moduleName: string;
  targetId?: string;
  targetName?: string;
  detail: string;
  ip: string;
  userAgent: string;
  createTime: string;
}

export interface OperationLogQuery {
  username?: string;
  operationType?: string;
  moduleName?: string;
  startTime?: string;
  endTime?: string;
}

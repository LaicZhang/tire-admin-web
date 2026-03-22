import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

/** 操作日志查询参数 */
export interface OperationLogQuery {
  page?: number;
  pageSize?: number;
  username?: string;
  operationType?: string;
  moduleName?: string;
  startTime?: string;
  endTime?: string;
}

/** 操作日志记录 */
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

interface SystemLogListItem {
  id: number;
  module: string;
  method: string;
  operator: string;
  ip: string;
  duration: number;
  traceId?: string;
  success: boolean;
  createdAt: string;
  params: string;
  result: string;
  error: string;
}

interface SystemLogListResponse {
  list: SystemLogListItem[];
  total: number;
}

const operationTypeNameMap: Record<string, string> = {
  create: "新增",
  update: "修改",
  delete: "删除",
  query: "查询",
  import: "导入",
  export: "导出",
  audit: "审核",
  unaudit: "反审核",
  login: "登录",
  logout: "登出"
};

const moduleNameMap: Record<string, string> = {
  purchase: "采购管理",
  sales: "销售管理",
  inventory: "库存管理",
  finance: "资金管理",
  basic: "基础资料",
  system: "系统设置"
};

function toOperationLog(item: SystemLogListItem): OperationLog {
  const detailParts = [item.params, item.result, item.error].filter(Boolean);
  return {
    uid: String(item.id),
    userId: "",
    username: item.operator,
    operationType: item.method,
    operationTypeName: operationTypeNameMap[item.method] || item.method,
    moduleName: moduleNameMap[item.module] || item.module,
    detail: detailParts.join(" | "),
    ip: item.ip,
    userAgent: "",
    createTime: item.createdAt
  };
}

export async function getOperationLogsApi(params?: OperationLogQuery) {
  const page = params?.page || 1;
  const response = await http.request<CommonResult<SystemLogListResponse>>(
    "get",
    baseUrlApi(`/system/log/list/${page}`),
    {
      params: {
        operator: params?.username,
        method: params?.operationType,
        module: params?.moduleName,
        startDate: params?.startTime,
        endDate: params?.endTime,
        pageSize: params?.pageSize
      }
    }
  );
  return {
    ...response,
    data: {
      list: (response.data?.list || []).map(toOperationLog),
      total: response.data?.total || 0
    } as PaginatedResponseDto<OperationLog>
  };
}

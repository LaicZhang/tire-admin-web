import { http } from "@/utils/http";

// 盘点任务接口类型
export interface InventoryCheckTask {
  id: number;
  uid: string;
  companyId: string;
  repoId: string;
  name?: string;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  isAudited?: boolean;
  resultSavedAt?: string;
  auditedAt?: string;
  auditedBy?: string;
  surplusOrderUid?: string;
  wasteOrderUid?: string;
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
  repoName?: string;
  details?: InventoryCheckDetail[];
}

export interface InventoryCheckDetail {
  id: number;
  taskId: number;
  tireId: string;
  tireName?: string;
  tireBarcode?: string;
  bookCount: number;
  actualCount?: number;
  difference?: number;
  remark?: string;
  repoId?: string;
  tire?: { name: string };
}

export interface CreateInventoryCheckDto {
  repoId: string;
  name?: string;
  tireIds?: string[];
  remark?: string;
}

export interface UpdateInventoryCheckDto {
  details: {
    detailId: number;
    actualCount: number;
    remark?: string;
  }[];
}

export type InventoryCheckImportMode = "replace" | "accumulate";

// 创建盘点任务
export const createInventoryCheckTaskApi = (data: CreateInventoryCheckDto) => {
  return http.request<{ data: InventoryCheckTask; code: number }>(
    "post",
    "/api/v1/inventory-check/task",
    { data }
  );
};

// 获取盘点任务列表
export const getInventoryCheckTasksApi = (
  index: number = 1,
  params?: { status?: string; repoId?: string }
) => {
  return http.request<{
    data: { count: number; list: InventoryCheckTask[] };
    code: number;
  }>("get", `/api/v1/inventory-check/tasks/${index}`, { params });
};

// 获取盘点任务详情
export const getInventoryCheckTaskApi = (id: number) => {
  return http.request<{ data: InventoryCheckTask; code: number }>(
    "get",
    `/api/v1/inventory-check/task/${id}`
  );
};

// 更新盘点明细
export const updateInventoryCheckDetailsApi = (
  id: number,
  data: UpdateInventoryCheckDto
) => {
  return http.request<{ data: InventoryCheckTask; code: number }>(
    "put",
    `/api/v1/inventory-check/task/${id}/details`,
    { data }
  );
};

export const saveInventoryCheckTaskApi = (id: number) => {
  return http.request<{ data: InventoryCheckTask; code: number }>(
    "put",
    `/api/v1/inventory-check/task/${id}/save`
  );
};

export const importInventoryCheckDetailsApi = (
  id: number,
  file: File,
  mode: InventoryCheckImportMode = "replace"
) => {
  const data = new FormData();
  data.append("file", file);
  data.append("mode", mode);
  return http.request<{ data: InventoryCheckTask; code: number }>(
    "post",
    `/api/v1/inventory-check/task/${id}/import`,
    {
      data,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
};

export const exportInventoryCheckSystemStockApi = (id: number) => {
  return http.request<Blob>(
    "get",
    `/api/v1/inventory-check/task/${id}/export-system-stock`,
    { responseType: "blob" }
  );
};

export const exportInventoryCheckResultApi = (id: number) => {
  return http.request<Blob>(
    "get",
    `/api/v1/inventory-check/task/${id}/export-result`,
    { responseType: "blob" }
  );
};

export const auditInventoryCheckTaskApi = (id: number) => {
  return http.request<{
    data: {
      task: InventoryCheckTask;
      surplusOrderId?: string;
      wasteOrderId?: string;
    };
    code: number;
  }>("post", `/api/v1/inventory-check/task/${id}/audit`);
};

export const reverseAuditInventoryCheckTaskApi = (id: number) => {
  return http.request<{ data: InventoryCheckTask; code: number }>(
    "post",
    `/api/v1/inventory-check/task/${id}/reverse-audit`
  );
};

// 完成盘点任务
export const completeInventoryCheckTaskApi = (id: number) => {
  return http.request<{
    data: {
      task: InventoryCheckTask;
      surplusOrderId?: string;
      wasteOrderId?: string;
    };
    code: number;
  }>("post", `/api/v1/inventory-check/task/${id}/complete`);
};

// 取消盘点任务
export const cancelInventoryCheckTaskApi = (id: number) => {
  return http.request<{ data: InventoryCheckTask; code: number }>(
    "post",
    `/api/v1/inventory-check/task/${id}/cancel`
  );
};

// 删除盘点任务
export const deleteInventoryCheckTaskApi = (id: number) => {
  return http.request<{ data: InventoryCheckTask; code: number }>(
    "delete",
    `/api/v1/inventory-check/task/${id}`
  );
};

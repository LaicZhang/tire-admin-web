import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/system/task";

export interface TaskItem {
  id: number;
  name: string;
  cron: string;
  parameters: string;
  description: string;
  status: boolean;
  nextRunTime: string;
  createTime: string;
  service: string;
}

export interface TaskDto {
  name: string;
  cron: string;
  parameters?: string;
  description?: string;
  service: string;
}

export async function getTaskListApi(params?: object) {
  return await http.request<CommonResult<PaginatedResponseDto<TaskItem>>>(
    "get",
    baseUrlApi(`${prefix}/list`),
    {
      params
    }
  );
}

export async function createTaskApi(data: TaskDto) {
  return await http.request<CommonResult<TaskItem>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function updateTaskApi(id: number, data: Partial<TaskDto>) {
  return await http.request<CommonResult<TaskItem>>(
    "put",
    baseUrlApi(`${prefix}/${id}`),
    {
      data
    }
  );
}

export async function deleteTaskApi(id: number) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${id}`)
  );
}

export async function runTaskApi(id: number) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`${prefix}/run/${id}`)
  );
}

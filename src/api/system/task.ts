import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

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

export async function getTaskListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(`${prefix}/list`), {
    params
  });
}

export async function createTaskApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function updateTaskApi(id: number, data: object) {
  return await http.request<CommonResult>(
    "put",
    baseUrlApi(`${prefix}/${id}`),
    {
      data
    }
  );
}

export async function deleteTaskApi(id: number) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`${prefix}/${id}`)
  );
}

export async function runTaskApi(id: number) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`${prefix}/run/${id}`)
  );
}

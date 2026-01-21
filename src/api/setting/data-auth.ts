import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export async function getDataAuthUsersApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/data-auth/users"),
    { params }
  );
}

export async function getUserDataAuthApi(userId: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/data-auth/users/" + userId)
  );
}

export async function syncCustomerAuthApi(userId: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/data-auth/users/" + userId + "/sync-customers")
  );
}

export async function saveUserDataAuthApi(userId: string, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi("/data-auth/users/" + userId),
    { data }
  );
}

export async function exportDataAuthApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/data-auth/export")
  );
}

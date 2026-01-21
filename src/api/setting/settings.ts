import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/setting/";

export async function getSettingListApi(index: number) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index)
  );
}

export async function getSettingGroupApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "list"));
}

export async function addSettingApi(data: {
  key: string;
  value?: string;
  group?: string;
}) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getSettingApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateSettingApi(
  uid: string,
  data: {
    key?: string;
    value?: string;
    group?: string;
  }
) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteSettingApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function batchUpdateSettingsApi(
  group: string,
  data: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "batch"),
    {
      data: { group, settings: data }
    }
  );
}

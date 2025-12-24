import { http } from "../../utils/http";
import { baseUrlApi } from "./../utils";
import type { CommonResult } from "./../type";

const prefix = "/tire-number/";

export interface TireNumberQueryDto {
  keyword?: string;
  tireId?: string;
}

export interface TireNumberDto {
  number: string;
  tireId: string;
  repoId: string;
  cost?: number;
  price?: number;
}

export async function getTireNumberListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addTireNumberApi(data: TireNumberDto) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getTireNumberApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateTireNumberApi(
  uid: string,
  data: Partial<TireNumberDto>
) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteTireNumberApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function importTireNumberApi(data: TireNumberDto[]) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "import"),
    { data }
  );
}

export async function getTireNumberByNumberApi(number: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + number));
}

export async function updateTireNumberByNumberApi(
  number: string,
  data: Partial<TireNumberDto>
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + number),
    { data }
  );
}

export async function deleteTireNumberByNumberApi(number: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + number)
  );
}

export async function outRepoTireNumberApi(number: string) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "out/" + number)
  );
}

import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/role/";

export interface PositionDto {
  name: string;
  desc?: string;
  company?: { connect: { uid: string } };
}

export interface Position extends PositionDto {
  id: number;
  uid: string;
}

export async function getPositionListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<Position>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addPositionApi(data: PositionDto) {
  return await http.request<CommonResult<Position>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getPositionApi(uid: string) {
  return await http.request<CommonResult<Position>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updatePositionApi(
  uid: string,
  data: Partial<PositionDto>
) {
  return await http.request<CommonResult<Position>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deletePositionApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function getPositionMenuUidsApi(uid: string) {
  return await http.request<CommonResult<string[]>>(
    "get",
    baseUrlApi(`${prefix}${uid}/menus`)
  );
}

export async function setPositionMenusApi(uid: string, menuUids: string[]) {
  return await http.request<CommonResult<void>>(
    "patch",
    baseUrlApi(`${prefix}${uid}/menus`),
    {
      data: { menuUids }
    }
  );
}

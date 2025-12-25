import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type {
  CommonResult,
  PaginatedResponseDto,
  CountResponseDto
} from "../type";

const prefix = "/assembly-order/";

export interface AssemblyOrderDto {
  targetTireId: string;
  quantity: number;
  components?: Array<{ tireId: string; quantity: number }>;
}

export interface AssemblyOrder extends AssemblyOrderDto {
  id: number;
  uid: string;
}

export async function getAssemblyOrderListApi(index: number, params?: object) {
  return await http.request<CommonResult<PaginatedResponseDto<AssemblyOrder>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addAssemblyOrderApi(data: AssemblyOrderDto) {
  return await http.request<CommonResult<AssemblyOrder>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getAssemblyOrderApi(uid: string) {
  return await http.request<CommonResult<AssemblyOrder>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateAssemblyOrderApi(
  uid: string,
  data: Partial<AssemblyOrderDto>
) {
  return await http.request<CommonResult<AssemblyOrder>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deleteAssemblyOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function getAssemblyOrderCountApi() {
  return await http.request<CommonResult<CountResponseDto>>(
    "get",
    baseUrlApi(prefix + "count")
  );
}

export async function createAssemblyOrderDetailApi(
  uid: string,
  data: { tireId: string; quantity: number }
) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + `detail/${uid}`),
    { data }
  );
}

export async function updateAssemblyOrderDetailApi(
  uid: string,
  data: { quantity?: number }
) {
  return await http.request<CommonResult<void>>(
    "patch",
    baseUrlApi(prefix + `detail/${uid}`),
    { data }
  );
}

export async function deleteAssemblyOrderDetailApi(
  uid: string,
  detailId: string
) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + `detail/${uid}/${detailId}`)
  );
}

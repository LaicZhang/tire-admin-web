import { createUid } from "@/utils/uid";
import { useUserStoreHook } from "@/store/modules/user";
import { http } from "../../utils/http";
import { getCompanyId } from "../company";
import { baseUrlApi } from "../utils";
import type {
  CommonResult,
  PaginatedResponseDto,
  CountResponseDto
} from "../type";
import type {
  AssemblyOrder,
  AssemblyOrderQuery,
  CreateAssemblyOrderDto,
  UpdateAssemblyOrderDto
} from "@/views/inventory/assembly/types";
import {
  buildAssemblyCreatePayload,
  buildAssemblyUpdatePayload,
  mapAssemblyOrderRecord,
  type RawAssemblyOrder
} from "../inventory-adapters";

const prefix = "/assembly-order/";

export async function getAssemblyOrderListApi(
  index: number,
  params?: AssemblyOrderQuery
) {
  const response = await http.request<
    CommonResult<{ count: number; list: RawAssemblyOrder[] }>
  >("get", baseUrlApi(prefix + "page/" + index), {
    params: { ...params, type: "ASSEMBLY" }
  });

  return {
    ...response,
    data: {
      total: response.data.count,
      list: response.data.list.map(mapAssemblyOrderRecord)
    }
  } satisfies CommonResult<PaginatedResponseDto<AssemblyOrder>>;
}

export async function addAssemblyOrderApi(data: CreateAssemblyOrderDto) {
  const payload = buildAssemblyCreatePayload(
    data,
    requireCompanyId(),
    requireUserId(),
    createUid()
  );
  return await http.request<CommonResult<AssemblyOrder>>(
    "post",
    baseUrlApi(prefix),
    { data: payload }
  );
}

export async function getAssemblyOrderApi(uid: string) {
  const response = await http.request<CommonResult<RawAssemblyOrder>>(
    "get",
    baseUrlApi(prefix + uid)
  );

  return {
    ...response,
    data: mapAssemblyOrderRecord(response.data)
  } satisfies CommonResult<AssemblyOrder>;
}

export async function updateAssemblyOrderApi(
  uid: string,
  data: UpdateAssemblyOrderDto
) {
  const payload = buildAssemblyUpdatePayload(
    data as CreateAssemblyOrderDto,
    requireCompanyId(),
    requireUserId()
  );

  return await http.request<CommonResult<AssemblyOrder>>(
    "patch",
    baseUrlApi(prefix + uid),
    { data: payload }
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

function requireCompanyId() {
  const companyId = getCompanyId();
  if (!companyId) {
    throw new Error("当前账套不存在，无法提交组装单");
  }
  return companyId;
}

function requireUserId() {
  const userId = useUserStoreHook().uid;
  if (!userId) {
    throw new Error("当前登录用户不存在，无法提交组装单");
  }
  return userId;
}

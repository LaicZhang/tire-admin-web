import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type {
  CommonResult,
  PaginatedResponseDto,
  CountResponseDto
} from "../type";

const prefix = "/assembly-order/";

export enum AssemblyOrderStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed"
}

export interface AssemblyComponent {
  id?: number;
  tireId: string;
  tireName?: string;
  tireBarcode?: string;
  repoId?: string;
  repoName?: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  remark?: string;
  _uid?: string;
}

export interface CreateAssemblyOrderDto {
  targetTireId: string;
  targetRepoId: string;
  quantity: number;
  assemblyFee?: number;
  orderDate?: string;
  bomId?: string;
  remark?: string;
  components: (Omit<
    AssemblyComponent,
    "id" | "tireName" | "tireBarcode" | "repoName" | "totalCost"
  > & { _uid?: string })[];
}

export type UpdateAssemblyOrderDto = Partial<CreateAssemblyOrderDto>;

export interface AssemblyOrder {
  id: number;
  uid: string;
  orderNumber?: string;
  targetTireId: string;
  targetTireName?: string;
  targetTireBarcode?: string;
  targetRepoId?: string;
  targetRepoName?: string;
  quantity: number;
  assemblyFee: number;
  totalCost?: number;
  status: AssemblyOrderStatus;
  isApproved: boolean;
  isLocked: boolean;
  operatorId?: string;
  operatorName?: string;
  auditorId?: string;
  auditorName?: string;
  orderDate?: string;
  bomId?: string;
  remark?: string;
  components: AssemblyComponent[];
  createdAt: string;
  updatedAt?: string;
}

/** 组装订单查询参数 */
export interface AssemblyOrderQuery {
  status?: AssemblyOrderStatus;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export async function getAssemblyOrderListApi(
  index: number,
  params?: AssemblyOrderQuery
) {
  return await http.request<CommonResult<PaginatedResponseDto<AssemblyOrder>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addAssemblyOrderApi(data: CreateAssemblyOrderDto) {
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
  data: UpdateAssemblyOrderDto
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

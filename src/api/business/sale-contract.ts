import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/sale-contract";

export type ContractStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "FULFILLED"
  | "EXPIRED"
  | "TERMINATED"
  | "CANCELLED";

export type ContractCategory = "FRAMEWORK" | "SPOT" | "LONG_TERM" | "SERVICE";

export interface ContractDetail {
  id?: number;
  lineNo?: number;
  tireId?: string | null;
  skuName?: string | null;
  unit?: string | null;
  quantity: number;
  minQty?: number | null;
  maxQty?: number | null;
  unitPrice: number | string;
  lineAmount?: number | string;
  orderedQty?: number;
  fulfilledQty?: number;
  remark?: string | null;
}

export interface Contract {
  id: number;
  uid: string;
  contractNo: string;
  externalNo?: string | null;
  title: string;
  type: "SALE" | "PURCHASE";
  category: ContractCategory;
  status: ContractStatus;
  signStatus?: string;
  customerId?: string | null;
  providerId?: string | null;
  customer?: { uid: string; name?: string | null } | null;
  provider?: { uid: string; name?: string | null } | null;
  operator?: { uid: string; name?: string | null } | null;
  totalAmount?: number | string;
  taxAmount?: number | string;
  amountWithoutTax?: number | string;
  version?: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  terminateReason?: string | null;
  remark?: string | null;
  details?: ContractDetail[];
  orderLinks?: Array<{ orderType: string; orderUid: string }>;
  eventLogs?: Array<{
    action: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    createdAt: string;
  }>;
  createdAt?: string;
}

export interface ContractPage {
  count: number;
  list: Contract[];
  pageSize?: number;
}

export interface CreateContractInput {
  title: string;
  category?: ContractCategory;
  customerId?: string;
  providerId?: string;
  storeId?: string;
  externalNo?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  remark?: string;
  templateId?: number;
  details: Array<{
    tireId?: string;
    skuName?: string;
    quantity: number;
    minQty?: number;
    maxQty?: number;
    unitPrice: number;
    remark?: string;
  }>;
}

export function getSaleContractsApi(
  index: number,
  params?: { status?: ContractStatus; keyword?: string; customerId?: string }
) {
  return http.request<CommonResult<ContractPage>>(
    "get",
    baseUrlApi(`${prefix}/page/${index}`),
    { params }
  );
}

export function getSaleContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "get",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

export function createSaleContractApi(data: CreateContractInput) {
  return http.request<CommonResult<Contract>>("post", baseUrlApi(prefix), {
    data
  });
}

export function updateSaleContractApi(
  uid: string,
  data: Partial<CreateContractInput>
) {
  return http.request<CommonResult<Contract>>(
    "patch",
    baseUrlApi(`${prefix}/${uid}`),
    { data }
  );
}

export function deleteSaleContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

export function submitSaleContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/submit`)
  );
}

export function approveSaleContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/approve`)
  );
}

export function rejectSaleContractApi(uid: string, reason: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/reject`),
    { data: { reason } }
  );
}

export function suspendSaleContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/suspend`)
  );
}

export function resumeSaleContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/resume`)
  );
}

export function terminateSaleContractApi(uid: string, reason: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/terminate`),
    { data: { reason } }
  );
}

export function convertSaleContractApi(
  uid: string,
  data: { storeId: string; repoId: string }
) {
  return http.request<
    CommonResult<{ orderUid: string; orderType: string; contract: Contract }>
  >("post", baseUrlApi(`${prefix}/${uid}/convert-order`), { data });
}

export function renewSaleContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/renew`)
  );
}

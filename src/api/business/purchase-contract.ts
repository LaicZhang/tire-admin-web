import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import type {
  Contract,
  ContractPage,
  ContractStatus,
  CreateContractInput
} from "./sale-contract";

const prefix = "/purchase-contract";

export type {
  Contract,
  ContractPage,
  ContractStatus,
  CreateContractInput
} from "./sale-contract";

export function getPurchaseContractsApi(
  index: number,
  params?: { status?: ContractStatus; keyword?: string; providerId?: string }
) {
  return http.request<CommonResult<ContractPage>>(
    "get",
    baseUrlApi(`${prefix}/page/${index}`),
    { params }
  );
}

export function getPurchaseContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "get",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

export function createPurchaseContractApi(data: CreateContractInput) {
  return http.request<CommonResult<Contract>>("post", baseUrlApi(prefix), {
    data
  });
}

export function updatePurchaseContractApi(
  uid: string,
  data: Partial<CreateContractInput>
) {
  return http.request<CommonResult<Contract>>(
    "patch",
    baseUrlApi(`${prefix}/${uid}`),
    { data }
  );
}

export function deletePurchaseContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

export function submitPurchaseContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/submit`)
  );
}

export function approvePurchaseContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/approve`)
  );
}

export function rejectPurchaseContractApi(uid: string, reason: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/reject`),
    { data: { reason } }
  );
}

export function suspendPurchaseContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/suspend`)
  );
}

export function resumePurchaseContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/resume`)
  );
}

export function terminatePurchaseContractApi(uid: string, reason: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/terminate`),
    { data: { reason } }
  );
}

export function convertPurchaseContractApi(
  uid: string,
  data: { storeId: string; repoId: string }
) {
  return http.request<
    CommonResult<{ orderUid: string; orderType: string; contract: Contract }>
  >("post", baseUrlApi(`${prefix}/${uid}/convert-order`), { data });
}

export function renewPurchaseContractApi(uid: string) {
  return http.request<CommonResult<Contract>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/renew`)
  );
}

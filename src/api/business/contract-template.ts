import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/contract-template";

export interface ContractTemplate {
  id: number;
  uid: string;
  name: string;
  type?: "SALE" | "PURCHASE" | null;
  category?: string | null;
  body: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ContractTemplatePage {
  count: number;
  list: ContractTemplate[];
  pageSize?: number;
}

export function getContractTemplatesApi(
  index: number,
  params?: { keyword?: string; type?: string; isActive?: boolean }
) {
  return http.request<CommonResult<ContractTemplatePage>>(
    "get",
    baseUrlApi(`${prefix}/page/${index}`),
    { params }
  );
}

export function createContractTemplateApi(data: {
  name: string;
  type?: "SALE" | "PURCHASE";
  category?: string;
  body: string;
  isActive?: boolean;
}) {
  return http.request<CommonResult<ContractTemplate>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export function updateContractTemplateApi(
  uid: string,
  data: Partial<{
    name: string;
    type: "SALE" | "PURCHASE";
    category: string;
    body: string;
    isActive: boolean;
  }>
) {
  return http.request<CommonResult<ContractTemplate>>(
    "patch",
    baseUrlApi(`${prefix}/${uid}`),
    { data }
  );
}

export function deleteContractTemplateApi(uid: string) {
  return http.request<CommonResult<ContractTemplate>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

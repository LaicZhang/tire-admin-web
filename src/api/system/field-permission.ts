import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export type FieldAccess = "view" | "edit" | "hidden";

export interface FieldCatalogItem {
  fieldKey: string;
  resource: string;
  label: string;
  description?: string | null;
  paths: string[];
}

export interface FieldMatrixItem {
  fieldKey: string;
  access: FieldAccess;
  label: string;
  resource: string;
}

export function getFieldPermissionCatalogApi() {
  return http.request<CommonResult<FieldCatalogItem[]>>(
    "get",
    baseUrlApi("/field-permission/catalog")
  );
}

export function getMyFieldPermissionMatrixApi() {
  return http.request<CommonResult<FieldMatrixItem[]>>(
    "get",
    baseUrlApi("/field-permission/me")
  );
}

export function getRoleFieldPermissionMatrixApi(roleId: string) {
  return http.request<CommonResult<FieldMatrixItem[]>>(
    "get",
    baseUrlApi(`/field-permission/role/${roleId}`)
  );
}

export function saveRoleFieldPermissionMatrixApi(
  roleId: string,
  items: Array<{ fieldKey: string; access: FieldAccess }>
) {
  return http.request<CommonResult<FieldMatrixItem[]>>(
    "put",
    baseUrlApi(`/field-permission/role/${roleId}`),
    { data: { items } }
  );
}

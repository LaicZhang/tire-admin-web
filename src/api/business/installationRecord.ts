import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

export interface InstallationRecordItem {
  uid: string;
  serialNo: string;
  vehiclePlateNo: string;
  vehicleModel?: string | null;
  mileageKm?: number | null;
  installPosition: string;
  installedAt: string;
  technicianName: string;
  warrantyStartAt: string;
  warrantyEndAt?: string | null;
  remark?: string | null;
  storeId: string;
  store?: { uid?: string; name?: string | null } | null;
  tireId: string;
  tire?: { uid?: string; name?: string | null } | null;
}

export interface CreateInstallationRecordPayload {
  serialNo: string;
  storeId: string;
  vehiclePlateNo: string;
  vehicleModel?: string | null;
  mileageKm?: number | null;
  installPosition: string;
  technicianName: string;
  installedAt?: string | null;
  warrantyEndAt?: string | null;
  remark?: string | null;
}

const prefix = "/installation-record";

export function getInstallationRecordListApi(
  index: number,
  params?: {
    serialNo?: string;
    vehiclePlateNo?: string;
    storeId?: string;
  }
) {
  return http.request<
    CommonResult<PaginatedResponseDto<InstallationRecordItem>>
  >("get", baseUrlApi(`${prefix}/page/${index}`), { params });
}

export function createInstallationRecordApi(
  data: CreateInstallationRecordPayload
) {
  return http.request<CommonResult<InstallationRecordItem>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export function getInstallationRecordApi(uid: string) {
  return http.request<CommonResult<InstallationRecordItem>>(
    "get",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

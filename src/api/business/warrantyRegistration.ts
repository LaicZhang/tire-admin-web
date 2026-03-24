import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

export interface WarrantyRegistrationItem {
  uid: string;
  serialNo: string;
  vehiclePlateNo: string;
  vehicleModel?: string | null;
  mileageKm?: number | null;
  installPosition: string;
  technicianName: string;
  warrantyStartAt: string;
  warrantyEndAt?: string | null;
  remark?: string | null;
  storeId: string;
  store?: { uid?: string; name?: string | null } | null;
  tireId: string;
  tire?: { uid?: string; name?: string | null } | null;
  installationRecord?: { uid?: string | null } | null;
}

const prefix = "/warranty-registration";

export function getWarrantyRegistrationListApi(
  index: number,
  params?: {
    serialNo?: string;
    vehiclePlateNo?: string;
    storeId?: string;
    warrantyStartFrom?: string;
    warrantyStartTo?: string;
    warrantyEndFrom?: string;
    warrantyEndTo?: string;
  }
) {
  return http.request<
    CommonResult<PaginatedResponseDto<WarrantyRegistrationItem>>
  >("get", baseUrlApi(`${prefix}/page/${index}`), { params });
}

import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, PaginatedResponseDto } from "./type";
import type { OtherInboundOrder } from "@/views/inventory/otherInbound/types";
import type { OtherOutboundOrder } from "@/views/inventory/otherOutbound/types";
import type { InventoryDocument } from "@/views/inventory/documents/types";
import type { AssemblyOrder } from "@/views/inventory/assembly/types";
import type { DisassemblyOrder } from "@/views/inventory/disassembly/types";
import type { CostRecalcTask } from "@/views/inventory/costRecalc/types";

const disassemblyPrefix = "/disassembly-order/";
const costRecalcPrefix = "/cost-recalc/";
const bomPrefix = "/bom/";
const otherInboundPrefix = "/other-inbound-order/";
const otherOutboundPrefix = "/other-outbound-order/";
const inventoryDocumentPrefix = "/inventory-document/";

// =========================
// Disassembly Order
// =========================

export async function getDisassemblyOrderListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<DisassemblyOrder>>
  >("get", baseUrlApi(disassemblyPrefix + "page/" + index), { params });
}

export async function createDisassemblyOrderApi(data: unknown) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(disassemblyPrefix),
    { data }
  );
}

export async function updateDisassemblyOrderApi(uid: string, data: unknown) {
  return await http.request<CommonResult<unknown>>(
    "patch",
    baseUrlApi(disassemblyPrefix + uid),
    { data }
  );
}

export async function deleteDisassemblyOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(disassemblyPrefix + uid)
  );
}

export async function approveDisassemblyOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(disassemblyPrefix + uid + "/approve")
  );
}

export async function rejectDisassemblyOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(disassemblyPrefix + uid + "/reject"),
    { data: { reason } }
  );
}

export async function saveDisassemblyOrderAsBomApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(disassemblyPrefix + uid + "/save-as-bom")
  );
}

export async function createDisassemblyOrderFromBomApi(bomUid: string) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(disassemblyPrefix + "from-bom/" + bomUid)
  );
}

// =========================
// BOM
// =========================

export async function getBomListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<AssemblyOrder>>>(
    "get",
    baseUrlApi(bomPrefix + "page/" + index),
    { params }
  );
}

export async function createBomApi(data: unknown) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(bomPrefix),
    {
      data
    }
  );
}

export async function updateBomApi(uid: string, data: unknown) {
  return await http.request<CommonResult<unknown>>(
    "patch",
    baseUrlApi(bomPrefix + uid),
    { data }
  );
}

export async function deleteBomApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(bomPrefix + uid)
  );
}

export async function approveBomApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(bomPrefix + uid + "/approve")
  );
}

export async function disableBomApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(bomPrefix + uid + "/disable")
  );
}

export async function createAssemblyOrderFromBomApi(bomUid: string) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi("/assembly-order/from-bom/" + bomUid)
  );
}

// =========================
// Cost Recalc
// =========================

export async function getCostRecalcTaskListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<CostRecalcTask>>>(
    "get",
    baseUrlApi(costRecalcPrefix + "page/" + index),
    { params }
  );
}

export async function createCostRecalcTaskApi(data: unknown) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(costRecalcPrefix),
    { data }
  );
}

export async function cancelCostRecalcTaskApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(costRecalcPrefix + uid + "/cancel")
  );
}

export async function restoreCostRecalcTaskApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(costRecalcPrefix + uid + "/restore")
  );
}

export async function deleteCostRecalcTaskApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(costRecalcPrefix + uid)
  );
}

// =========================
// Other Inbound
// =========================

export async function getOtherInboundOrderListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<OtherInboundOrder>>
  >("get", baseUrlApi(otherInboundPrefix + "page/" + index), { params });
}

export async function createOtherInboundOrderApi(data: unknown) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(otherInboundPrefix),
    { data }
  );
}

export async function updateOtherInboundOrderApi(uid: string, data: unknown) {
  return await http.request<CommonResult<unknown>>(
    "patch",
    baseUrlApi(otherInboundPrefix + uid),
    { data }
  );
}

export async function deleteOtherInboundOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(otherInboundPrefix + uid)
  );
}

export async function approveOtherInboundOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(otherInboundPrefix + uid + "/approve")
  );
}

export async function rejectOtherInboundOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(otherInboundPrefix + uid + "/reject"),
    { data: { reason } }
  );
}

// =========================
// Other Outbound
// =========================

export async function getOtherOutboundOrderListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<OtherOutboundOrder>>
  >("get", baseUrlApi(otherOutboundPrefix + "page/" + index), { params });
}

export async function createOtherOutboundOrderApi(data: unknown) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(otherOutboundPrefix),
    { data }
  );
}

export async function updateOtherOutboundOrderApi(uid: string, data: unknown) {
  return await http.request<CommonResult<unknown>>(
    "patch",
    baseUrlApi(otherOutboundPrefix + uid),
    { data }
  );
}

export async function deleteOtherOutboundOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(otherOutboundPrefix + uid)
  );
}

export async function approveOtherOutboundOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(otherOutboundPrefix + uid + "/approve")
  );
}

export async function rejectOtherOutboundOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(otherOutboundPrefix + uid + "/reject"),
    { data: { reason } }
  );
}

// =========================
// Inventory Documents
// =========================

export async function getInventoryDocumentListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<InventoryDocument>>
  >("get", baseUrlApi(inventoryDocumentPrefix + "page/" + index), { params });
}

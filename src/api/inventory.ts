import { PAGE_SIZE_MEDIUM } from "@/utils/constants";
import { createUid } from "@/utils/uid";
import { useUserStoreHook } from "@/store/modules/user";
import { http } from "../utils/http";
import { getCompanyId } from "./company";
import {
  auditOrderApi,
  getOrderListApi,
  type AuditOrderDto
} from "./business/order";
import { getCostAdjustOrderList } from "./business/costAdjust";
import {
  getInventoryCheckTasksApi,
  type InventoryCheckTask
} from "./business/inventory-check";
import { baseUrlApi } from "./utils";
import type { CommonResult, PaginatedResponseDto } from "./type";
import type { TransferOrder } from "@/views/inventory/transfer/types";
import type { OtherInboundOrder } from "@/views/inventory/otherInbound/types";
import type { CreateOtherInboundDto } from "@/views/inventory/otherInbound/types";
import { OtherInboundType } from "@/views/inventory/otherInbound/types";
import type { OtherOutboundOrder } from "@/views/inventory/otherOutbound/types";
import type { CreateOtherOutboundDto } from "@/views/inventory/otherOutbound/types";
import { OtherOutboundType } from "@/views/inventory/otherOutbound/types";
import { DocumentType } from "@/views/inventory/documents/types";
import type {
  Bom,
  CreateBomDto,
  UpdateBomDto
} from "@/views/inventory/bom/types";
import type { DisassemblyOrder } from "@/views/inventory/disassembly/types";
import type { CreateDisassemblyOrderDto } from "@/views/inventory/disassembly/types";
import type { CostRecalcTask } from "@/views/inventory/costRecalc/types";
import {
  buildBomPayload,
  buildDisassemblyCreatePayload,
  buildDisassemblyUpdatePayload,
  buildOtherInboundCreatePayload,
  buildOtherInboundUpdatePayload,
  buildOtherOutboundCreatePayload,
  buildOtherOutboundUpdatePayload,
  filterInventoryDocuments,
  mapAssemblyOrderToDisassembly,
  mapAssemblyOrderToInventoryDocument,
  mapBomRecord as mapBom,
  mapCostAdjustToInventoryDocument,
  mapInventoryCheckToInventoryDocument,
  mapOtherInboundToInventoryDocument,
  mapOtherOutboundToInventoryDocument,
  mapSurplusOrderToOtherInbound,
  mapTransferOrderToInventoryDocument,
  mapWasteOrderToOtherOutbound,
  type InventoryDocumentFilter,
  type RawAssemblyOrder,
  type RawBom,
  type RawCostAdjustOrder,
  type RawSurplusOrder,
  type RawWasteOrder
} from "./inventory-adapters";

const FETCH_PAGE_SIZE = 100;
const bomPrefix = "/bom/";
const costRecalcPrefix = "/cost-recalc/";

type RawPageResult<T> = {
  total: number;
  list: T[];
};

type SupportedAuditType = "assembly-order" | "surplus-order" | "waste-order";

/** 库存订单通用查询参数 */
export interface InventoryOrderQueryDto {
  type?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  isApproved?: boolean;
  repoId?: string;
  tireId?: string;
  operatorId?: string;
  auditorId?: string;
  pageSize?: number;
}

export async function getDisassemblyOrderListApi(
  index: number,
  params?: InventoryOrderQueryDto
) {
  const orders = await fetchAllDisassemblyOrders();
  const filtered = filterDisassemblyOrders(orders, params);
  return buildSuccessResult(paginateList(filtered, index, params?.pageSize));
}

export async function createDisassemblyOrderApi(
  data: CreateDisassemblyOrderDto
) {
  const payload = buildDisassemblyCreatePayload(
    data,
    requireCompanyId(),
    requireUserId(),
    createUid()
  );
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi("/assembly-order"),
    { data: payload }
  );
}

export async function updateDisassemblyOrderApi(
  uid: string,
  data: CreateDisassemblyOrderDto
) {
  const payload = buildDisassemblyUpdatePayload(
    data,
    requireCompanyId(),
    requireUserId()
  );
  return await http.request<CommonResult<unknown>>(
    "patch",
    baseUrlApi("/assembly-order/" + uid),
    { data: payload }
  );
}

export async function deleteDisassemblyOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi("/assembly-order/" + uid)
  );
}

export async function approveDisassemblyOrderApi(uid: string) {
  return await auditOrderApi(uid, buildAuditPayload("assembly-order", true));
}

export async function rejectDisassemblyOrderApi(uid: string, reason: string) {
  return await auditOrderApi(
    uid,
    buildAuditPayload("assembly-order", false, reason)
  );
}

export async function saveDisassemblyOrderAsBomApi(uid: string) {
  return await createBomFromOrderApi(uid);
}

export async function createDisassemblyOrderFromBomApi(bomUid: string) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(bomPrefix + bomUid + "/create-disassembly")
  );
}

export async function getBomListApi(
  index: number,
  params?: InventoryOrderQueryDto
) {
  const response = await http.request<
    CommonResult<{ total: number; list: RawBom[] }>
  >("get", baseUrlApi(bomPrefix + "page/" + index), { params });
  return {
    ...response,
    data: {
      total: response.data.total,
      list: response.data.list.map(mapBom)
    }
  } satisfies CommonResult<PaginatedResponseDto<Bom>>;
}

export async function createBomApi(data: CreateBomDto) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(bomPrefix),
    {
      data: buildBomPayload(data)
    }
  );
}

export async function updateBomApi(uid: string, data: UpdateBomDto) {
  return await http.request<CommonResult<unknown>>(
    "patch",
    baseUrlApi(bomPrefix + uid),
    { data: buildBomPayload(data) }
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
    baseUrlApi(bomPrefix + bomUid + "/create-assembly")
  );
}

export async function createBomFromOrderApi(orderUid: string) {
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(bomPrefix + "from-order/" + orderUid)
  );
}

export async function getCostRecalcTaskListApi(
  index: number,
  params?: InventoryOrderQueryDto
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

export async function getOtherInboundOrderListApi(
  index: number,
  params?: InventoryOrderQueryDto
) {
  const orders = await fetchAllOtherInboundOrders();
  const filtered = filterOtherInboundOrders(orders, params);
  return buildSuccessResult(paginateList(filtered, index, params?.pageSize));
}

export async function createOtherInboundOrderApi(data: CreateOtherInboundDto) {
  const payload = buildOtherInboundCreatePayload(
    data,
    requireCompanyId(),
    requireUserId()
  );
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi("/surplus-order"),
    { data: payload }
  );
}

export async function updateOtherInboundOrderApi(
  uid: string,
  data: CreateOtherInboundDto
) {
  const payload = buildOtherInboundUpdatePayload(
    data,
    requireCompanyId(),
    requireUserId()
  );
  return await http.request<CommonResult<unknown>>(
    "patch",
    baseUrlApi("/surplus-order/" + uid),
    { data: payload }
  );
}

export async function deleteOtherInboundOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi("/surplus-order/" + uid)
  );
}

export async function approveOtherInboundOrderApi(uid: string) {
  return await auditOrderApi(uid, buildAuditPayload("surplus-order", true));
}

export async function rejectOtherInboundOrderApi(uid: string, reason: string) {
  return await auditOrderApi(
    uid,
    buildAuditPayload("surplus-order", false, reason)
  );
}

export async function getOtherOutboundOrderListApi(
  index: number,
  params?: InventoryOrderQueryDto
) {
  const orders = await fetchAllOtherOutboundOrders();
  const filtered = filterOtherOutboundOrders(orders, params);
  return buildSuccessResult(paginateList(filtered, index, params?.pageSize));
}

export async function createOtherOutboundOrderApi(
  data: CreateOtherOutboundDto
) {
  const payload = buildOtherOutboundCreatePayload(
    data,
    requireCompanyId(),
    requireUserId(),
    createUid()
  );
  return await http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi("/waste-order"),
    { data: payload }
  );
}

export async function updateOtherOutboundOrderApi(
  uid: string,
  data: CreateOtherOutboundDto
) {
  const payload = buildOtherOutboundUpdatePayload(
    data,
    requireCompanyId(),
    requireUserId(),
    uid
  );
  return await http.request<CommonResult<unknown>>(
    "patch",
    baseUrlApi("/waste-order/" + uid),
    { data: payload }
  );
}

export async function deleteOtherOutboundOrderApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi("/waste-order/" + uid)
  );
}

export async function approveOtherOutboundOrderApi(uid: string) {
  return await auditOrderApi(uid, buildAuditPayload("waste-order", true));
}

export async function rejectOtherOutboundOrderApi(uid: string, reason: string) {
  return await auditOrderApi(
    uid,
    buildAuditPayload("waste-order", false, reason)
  );
}

export async function getInventoryDocumentListApi(
  index: number,
  params?: InventoryOrderQueryDto
) {
  const documents = await fetchInventoryDocuments(params);
  const filtered = filterInventoryDocuments(
    documents,
    toDocumentFilter(params)
  );
  return buildSuccessResult(paginateList(filtered, index, params?.pageSize));
}

async function fetchInventoryDocuments(params?: InventoryOrderQueryDto) {
  const sources = resolveDocumentSources(params?.type);
  const loaders = sources.map(loadInventoryDocumentSource);
  const results = await Promise.all(loaders);
  return results.flat();
}

function resolveDocumentSources(type?: string) {
  if (!type) return Object.values(DocumentType);
  return [type as DocumentType];
}

function loadInventoryDocumentSource(type: DocumentType) {
  switch (type) {
    case DocumentType.TRANSFER:
      return loadTransferDocuments();
    case DocumentType.STOCKTAKING:
      return loadInventoryCheckDocuments();
    case DocumentType.OTHER_INBOUND:
      return loadOtherInboundDocuments();
    case DocumentType.OTHER_OUTBOUND:
      return loadOtherOutboundDocuments();
    case DocumentType.ASSEMBLY:
      return loadAssemblyDocuments();
    case DocumentType.DISASSEMBLY:
      return loadDisassemblyDocuments();
    case DocumentType.COST_ADJUST:
      return loadCostAdjustDocuments();
  }
}

async function loadTransferDocuments() {
  const list = await fetchAllTransferOrders();
  return list.map(mapTransferOrderToInventoryDocument);
}

async function loadInventoryCheckDocuments() {
  const list = await fetchAllInventoryChecks();
  return list.map(mapInventoryCheckToInventoryDocument);
}

async function loadOtherInboundDocuments() {
  const list = await fetchAllOtherInboundOrders();
  return list.map(mapOtherInboundToInventoryDocument);
}

async function loadOtherOutboundDocuments() {
  const list = await fetchAllOtherOutboundOrders();
  return list.map(mapOtherOutboundToInventoryDocument);
}

async function loadAssemblyDocuments() {
  const list = await fetchAllAssemblyOrders("ASSEMBLY");
  return list.map(item =>
    mapAssemblyOrderToInventoryDocument(item, DocumentType.ASSEMBLY)
  );
}

async function loadDisassemblyDocuments() {
  const list = await fetchAllAssemblyOrders("DISASSEMBLY");
  return list.map(item =>
    mapAssemblyOrderToInventoryDocument(item, DocumentType.DISASSEMBLY)
  );
}

async function loadCostAdjustDocuments() {
  const list = await fetchAllCostAdjustOrders();
  return list.map(mapCostAdjustToInventoryDocument);
}

async function fetchAllDisassemblyOrders() {
  const list = await fetchAllAssemblyOrders("DISASSEMBLY");
  return list.map(mapAssemblyOrderToDisassembly);
}

async function fetchAllOtherInboundOrders() {
  const list = await fetchAllSurplusOrders();
  return list.map(mapSurplusOrderToOtherInbound);
}

async function fetchAllOtherOutboundOrders() {
  const list = await fetchAllWasteOrders();
  return list.map(mapWasteOrderToOtherOutbound);
}

async function fetchAllAssemblyOrders(type: "ASSEMBLY" | "DISASSEMBLY") {
  return await fetchAllPages(page => requestAssemblyOrderPage(page, type));
}

async function fetchAllSurplusOrders() {
  return await fetchAllPages(requestSurplusOrderPage);
}

async function fetchAllWasteOrders() {
  return await fetchAllPages(requestWasteOrderPage);
}

async function fetchAllTransferOrders() {
  return await fetchAllPages(requestTransferOrderPage);
}

async function fetchAllInventoryChecks() {
  return await fetchAllPages(requestInventoryCheckPage);
}

async function fetchAllCostAdjustOrders() {
  return await fetchAllPages(requestCostAdjustPage);
}

async function requestAssemblyOrderPage(
  page: number,
  type: "ASSEMBLY" | "DISASSEMBLY"
) {
  const response = await http.request<
    CommonResult<{ count: number; list: RawAssemblyOrder[] }>
  >("get", baseUrlApi("/assembly-order/page/" + page), {
    params: {
      type
    }
  });
  assertSuccess(response, "获取组装/拆卸单列表失败");
  return {
    total: response.data.count,
    list: response.data.list || []
  } satisfies RawPageResult<RawAssemblyOrder>;
}

async function requestSurplusOrderPage(page: number) {
  const response = await http.request<
    CommonResult<{ count: number; list: RawSurplusOrder[] }>
  >("get", baseUrlApi("/surplus-order/page/" + page));
  assertSuccess(response, "获取其他入库单列表失败");
  return {
    total: response.data.count,
    list: response.data.list || []
  } satisfies RawPageResult<RawSurplusOrder>;
}

async function requestWasteOrderPage(page: number) {
  const response = await http.request<
    CommonResult<{ count: number; list: RawWasteOrder[] }>
  >("get", baseUrlApi("/waste-order/page/" + page));
  assertSuccess(response, "获取其他出库单列表失败");
  return {
    total: response.data.count,
    list: response.data.list || []
  } satisfies RawPageResult<RawWasteOrder>;
}

async function requestTransferOrderPage(page: number) {
  const response = await getOrderListApi<TransferOrder>(
    "transfer-order",
    page,
    {
      pageSize: FETCH_PAGE_SIZE
    }
  );
  assertSuccess(response, "获取调拨单列表失败");
  return {
    total: response.data.total,
    list: response.data.list || []
  } satisfies RawPageResult<TransferOrder>;
}

async function requestInventoryCheckPage(page: number) {
  const response = await getInventoryCheckTasksApi(page);
  assertSuccess(response, "获取盘点单列表失败");
  return {
    total: response.data.count,
    list: response.data.list || []
  } satisfies RawPageResult<InventoryCheckTask>;
}

async function requestCostAdjustPage(page: number) {
  const response = await getCostAdjustOrderList({ index: page });
  return {
    total: response.count,
    list: (response.list || []) as RawCostAdjustOrder[]
  } satisfies RawPageResult<RawCostAdjustOrder>;
}

async function fetchAllPages<T>(
  requestPage: (page: number) => Promise<RawPageResult<T>>
) {
  const list: T[] = [];
  let page = 1;
  let total = 0;

  while (page === 1 || list.length < total) {
    const result = await requestPage(page);
    total = result.total;
    list.push(...result.list);
    if (result.list.length === 0) break;
    page += 1;
  }

  return list;
}

function filterDisassemblyOrders(
  items: DisassemblyOrder[],
  query?: InventoryOrderQueryDto
) {
  return items
    .filter(item => matchStatus(item.status, query?.status))
    .filter(item => matchKeyword(item, query?.keyword));
}

function filterOtherInboundOrders(
  items: OtherInboundOrder[],
  query?: InventoryOrderQueryDto
) {
  return items
    .filter(() => {
      if (!query?.type) return true;
      return query.type === OtherInboundType.SURPLUS;
    })
    .filter(item => matchStatus(item.status, query?.status))
    .filter(item => matchKeyword(item, query?.keyword));
}

function filterOtherOutboundOrders(
  items: OtherOutboundOrder[],
  query?: InventoryOrderQueryDto
) {
  return items
    .filter(() => {
      if (!query?.type) return true;
      return query.type === OtherOutboundType.WASTE;
    })
    .filter(item => matchStatus(item.status, query?.status))
    .filter(item => matchKeyword(item, query?.keyword));
}

function matchStatus(status: string, expected?: string) {
  if (!expected) return true;
  return status === expected;
}

function matchKeyword(
  item: { orderNumber?: string; remark?: string; operatorName?: string },
  keyword?: string
) {
  if (!keyword?.trim()) return true;
  const normalized = keyword.trim().toLowerCase();
  return [item.orderNumber, item.remark, item.operatorName]
    .filter(Boolean)
    .some(value => String(value).toLowerCase().includes(normalized));
}

function paginateList<T>(
  items: T[],
  index: number,
  pageSize = PAGE_SIZE_MEDIUM
) {
  const start = Math.max(index - 1, 0) * pageSize;
  return {
    list: items.slice(start, start + pageSize),
    total: items.length,
    page: index,
    pageSize
  } satisfies PaginatedResponseDto<T>;
}

function buildSuccessResult<T>(data: T) {
  return {
    code: 200,
    msg: "success",
    data
  } satisfies CommonResult<T>;
}

function buildAuditPayload(
  type: SupportedAuditType,
  isApproved: boolean,
  desc?: string
) {
  return {
    type,
    isApproved,
    ...(desc ? { desc } : {})
  } satisfies AuditOrderDto;
}

function toDocumentFilter(query?: InventoryOrderQueryDto) {
  return {
    type: query?.type,
    status: query?.status,
    startDate: query?.startDate,
    endDate: query?.endDate,
    keyword: query?.keyword
  } satisfies InventoryDocumentFilter;
}

function requireCompanyId() {
  const companyId = getCompanyId();
  if (!companyId) {
    throw new Error("当前账套不存在，无法提交库存单据");
  }
  return companyId;
}

function requireUserId() {
  const userId = useUserStoreHook().uid;
  if (!userId) {
    throw new Error("当前登录用户不存在，无法提交库存单据");
  }
  return userId;
}

function assertSuccess(
  response: { code: number; msg?: string },
  fallbackMessage: string
) {
  if (response.code === 200) return;
  throw new Error(response.msg || fallbackMessage);
}

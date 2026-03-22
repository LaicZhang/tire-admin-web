import type { CostAdjustOrder } from "./business/costAdjust";
import type { InventoryCheckTask } from "./business/inventory-check";
import { createUid } from "@/utils/uid";
import type { TransferOrder } from "@/views/inventory/transfer/types";
import type { InventoryDocument } from "@/views/inventory/documents/types";
import {
  DocumentStatus,
  DocumentType
} from "@/views/inventory/documents/types";
import type {
  AssemblyComponent,
  AssemblyOrder,
  CreateAssemblyOrderDto
} from "@/views/inventory/assembly/types";
import { AssemblyOrderStatus } from "@/views/inventory/assembly/types";
import type {
  Bom,
  BomComponent,
  CreateBomDto,
  UpdateBomDto
} from "@/views/inventory/bom/types";
import type {
  CreateDisassemblyOrderDto,
  DisassemblyComponent,
  DisassemblyOrder
} from "@/views/inventory/disassembly/types";
import { DisassemblyOrderStatus } from "@/views/inventory/disassembly/types";
import type {
  CreateOtherInboundDto,
  OtherInboundDetail,
  OtherInboundOrder
} from "@/views/inventory/otherInbound/types";
import {
  OtherInboundStatus,
  OtherInboundType
} from "@/views/inventory/otherInbound/types";
import type {
  CreateOtherOutboundDto,
  OtherOutboundDetail,
  OtherOutboundOrder
} from "@/views/inventory/otherOutbound/types";
import {
  OtherOutboundStatus,
  OtherOutboundType
} from "@/views/inventory/otherOutbound/types";

type NumberLike = bigint | number | string | null | undefined;

interface RawEmployeeRef {
  uid?: string;
  name?: string;
}

interface RawRepoRef {
  uid?: string;
  name?: string;
}

interface RawTireRef {
  uid?: string;
  name?: string;
  barcode?: string;
}

export interface RawBomDetail {
  id: number;
  uid: string;
  tireId: string;
  tireName?: string;
  tireBarcode?: string;
  quantity: number;
  remark?: string;
}

export interface RawBom {
  id: number;
  uid: string;
  name: string;
  code?: string;
  targetTireId: string;
  targetTireName?: string;
  targetTireBarcode?: string;
  targetQuantity: number;
  status: string;
  isApproved: boolean;
  version?: string;
  estimatedMaterialCost?: NumberLike;
  remark?: string;
  createdBy?: string;
  creatorName?: string;
  createdAt: string;
  updatedAt?: string;
  details: RawBomDetail[];
}

export interface RawAssemblyOrderDetail {
  id: number;
  uid?: string | null;
  tireId: string;
  count: number;
  desc?: string | null;
  isResult?: boolean | null;
  tire?: RawTireRef;
}

export interface RawAssemblyOrder {
  id: number;
  uid?: string | null;
  number: NumberLike;
  docNo?: string | null;
  repoId: string;
  type?: "ASSEMBLY" | "DISASSEMBLY";
  operatorId: string;
  auditorId?: string | null;
  desc?: string | null;
  rejectReason?: string | null;
  isApproved?: boolean | null;
  isLocked?: boolean | null;
  createAt?: string | null;
  updateAt?: string | null;
  repo?: RawRepoRef;
  operator?: RawEmployeeRef;
  auditor?: RawEmployeeRef;
  details?: RawAssemblyOrderDetail[];
}

export interface RawSurplusOrderDetail {
  id: number;
  uid?: string | null;
  tireId: string;
  repoId: string;
  count: number;
  desc?: string | null;
  unitPrice?: NumberLike;
  tire?: RawTireRef;
  repo?: RawRepoRef;
}

export interface RawSurplusOrder {
  id: number;
  uid: string;
  number: NumberLike;
  docNo?: string | null;
  operatorId: string;
  auditorId?: string | null;
  desc?: string | null;
  rejectReason?: string | null;
  isApproved?: boolean | null;
  isLocked?: boolean | null;
  createAt?: string | null;
  updateAt?: string | null;
  operator?: RawEmployeeRef;
  auditor?: RawEmployeeRef;
  details?: RawSurplusOrderDetail[];
}

export interface RawWasteOrderDetail {
  id: number;
  uid?: string | null;
  tireId: string;
  repoId: string;
  count: number;
  unitPrice?: NumberLike;
  tire?: RawTireRef;
  repo?: RawRepoRef;
}

export interface RawWasteOrder {
  id: number;
  uid: string;
  number: NumberLike;
  docNo?: string | null;
  operatorId: string;
  auditorId?: string | null;
  desc?: string | null;
  rejectReason?: string | null;
  isApproved?: boolean | null;
  isLocked?: boolean | null;
  createAt?: string | null;
  updateAt?: string | null;
  operator?: RawEmployeeRef;
  auditor?: RawEmployeeRef;
  details?: RawWasteOrderDetail[];
}

export interface RawCostAdjustOrder extends CostAdjustOrder {
  rejectReason?: string | null;
}

export interface InventoryDocumentFilter {
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export function mapBomRecord(item: RawBom): Bom {
  return {
    id: item.id,
    uid: item.uid,
    name: item.name,
    code: item.code || "",
    targetTireId: item.targetTireId,
    targetTireName: item.targetTireName,
    targetTireBarcode: item.targetTireBarcode,
    targetQuantity: item.targetQuantity,
    status: item.status as Bom["status"],
    isApproved: item.isApproved,
    version: item.version,
    estimatedMaterialCost: toNumber(item.estimatedMaterialCost),
    remark: item.remark,
    components: item.details.map(mapBomComponent),
    createdBy: item.createdBy,
    creatorName: item.creatorName,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function mapBomComponent(item: RawBomDetail): BomComponent {
  return {
    id: item.id,
    tireId: item.tireId,
    tireName: item.tireName,
    tireBarcode: item.tireBarcode,
    quantity: item.quantity,
    remark: item.remark,
    _uid: item.uid
  };
}

export function buildBomPayload(data: CreateBomDto | UpdateBomDto) {
  return {
    name: data.name,
    code: data.code || undefined,
    targetTireId: data.targetTireId,
    targetQuantity: data.targetQuantity,
    version: data.version || undefined,
    remark: data.remark || undefined,
    details: (data.components || []).map(component => ({
      tireId: component.tireId,
      quantity: component.quantity,
      remark: component.remark || undefined
    }))
  };
}

export function mapAssemblyOrderToDisassembly(
  item: RawAssemblyOrder
): DisassemblyOrder {
  const sourceDetail = findResultDetail(item.details);
  const components = (item.details || [])
    .filter(detail => detail.isResult !== true)
    .map(detail =>
      mapDisassemblyComponent(detail, item.repoId, item.repo?.name)
    );

  return {
    id: item.id,
    uid: item.uid || "",
    orderNumber: getOrderNumber(item.docNo, item.number, item.uid),
    sourceTireId: sourceDetail?.tireId || "",
    sourceTireName: sourceDetail?.tire?.name,
    sourceTireBarcode: sourceDetail?.tire?.barcode,
    sourceRepoId: item.repoId,
    sourceRepoName: item.repo?.name,
    quantity: sourceDetail?.count || 0,
    disassemblyFee: 0,
    autoAllocateCost: true,
    status: toDisassemblyStatus(item.isApproved, item.rejectReason),
    isApproved: Boolean(item.isApproved),
    isLocked: Boolean(item.isLocked),
    operatorId: item.operatorId,
    operatorName: item.operator?.name,
    auditorId: item.auditorId || undefined,
    auditorName: item.auditor?.name,
    orderDate: normalizeDate(item.createAt),
    bomId: undefined,
    remark: item.desc || undefined,
    components,
    createdAt: normalizeDate(item.createAt),
    updatedAt: normalizeDate(item.updateAt)
  };
}

export function mapAssemblyOrderRecord(item: RawAssemblyOrder): AssemblyOrder {
  const targetDetail = findResultDetail(item.details);
  const components = (item.details || [])
    .filter(detail => detail.isResult !== true)
    .map(detail => mapAssemblyComponent(detail, item.repoId, item.repo?.name));

  return {
    id: item.id,
    uid: item.uid || "",
    orderNumber: getOrderNumber(item.docNo, item.number, item.uid),
    targetTireId: targetDetail?.tireId || "",
    targetTireName: targetDetail?.tire?.name,
    targetTireBarcode: targetDetail?.tire?.barcode,
    targetRepoId: item.repoId,
    targetRepoName: item.repo?.name,
    quantity: targetDetail?.count || 0,
    assemblyFee: 0,
    totalCost: undefined,
    status: toAssemblyStatus(item.isApproved, item.rejectReason),
    isApproved: Boolean(item.isApproved),
    isLocked: Boolean(item.isLocked),
    operatorId: item.operatorId,
    operatorName: item.operator?.name,
    auditorId: item.auditorId || undefined,
    auditorName: item.auditor?.name,
    orderDate: normalizeDate(item.createAt),
    bomId: undefined,
    remark: item.desc || undefined,
    components,
    createdAt: normalizeDate(item.createAt),
    updatedAt: normalizeDate(item.updateAt)
  };
}

function mapAssemblyComponent(
  item: RawAssemblyOrderDetail,
  repoId: string,
  repoName?: string
): AssemblyComponent {
  return {
    id: item.id,
    tireId: item.tireId,
    tireName: item.tire?.name,
    tireBarcode: item.tire?.barcode,
    repoId,
    repoName,
    quantity: item.count,
    unitCost: undefined,
    totalCost: undefined,
    remark: item.desc || undefined,
    _uid: item.uid || undefined
  };
}

export function buildAssemblyCreatePayload(
  data: CreateAssemblyOrderDto,
  companyId: string,
  userId: string,
  uid: string
) {
  return {
    order: {
      uid,
      company: { connect: { uid: companyId } },
      repo: { connect: { uid: data.targetRepoId } },
      operator: { connect: { uid: userId } },
      auditor: { connect: { uid: userId } },
      type: "ASSEMBLY" as const,
      desc: toNullableText(data.remark)
    },
    details: buildAssemblyDetails(data, companyId)
  };
}

export function buildAssemblyUpdatePayload(
  data: CreateAssemblyOrderDto,
  companyId: string,
  userId: string
) {
  return {
    company: { connect: { uid: companyId } },
    repo: { connect: { uid: data.targetRepoId } },
    operator: { connect: { uid: userId } },
    auditor: { connect: { uid: userId } },
    type: "ASSEMBLY" as const,
    desc: toNullableText(data.remark),
    details: {
      deleteMany: {},
      createMany: {
        data: buildAssemblyDetails(data, companyId)
      }
    }
  };
}

function buildAssemblyDetails(data: CreateAssemblyOrderDto, companyId: string) {
  const components = data.components.map(component => ({
    companyId,
    tireId: component.tireId,
    count: component.quantity,
    desc: toNullableText(component.remark),
    isResult: false
  }));
  const targetDetail = {
    companyId,
    tireId: data.targetTireId,
    count: data.quantity,
    desc: toNullableText(data.remark),
    isResult: true
  };

  return [...components, targetDetail];
}

function mapDisassemblyComponent(
  item: RawAssemblyOrderDetail,
  repoId: string,
  repoName?: string
): DisassemblyComponent {
  return {
    id: item.id,
    tireId: item.tireId,
    tireName: item.tire?.name,
    tireBarcode: item.tire?.barcode,
    repoId,
    repoName,
    quantity: item.count,
    unitCost: undefined,
    totalCost: undefined,
    remark: item.desc || undefined,
    _uid: item.uid || undefined
  };
}

export function buildDisassemblyCreatePayload(
  data: CreateDisassemblyOrderDto,
  companyId: string,
  userId: string,
  uid: string
) {
  return {
    order: {
      uid,
      company: { connect: { uid: companyId } },
      repo: { connect: { uid: data.sourceRepoId } },
      operator: { connect: { uid: userId } },
      auditor: { connect: { uid: userId } },
      type: "DISASSEMBLY" as const,
      desc: toNullableText(data.remark)
    },
    details: buildDisassemblyDetails(data, companyId)
  };
}

export function buildDisassemblyUpdatePayload(
  data: CreateDisassemblyOrderDto,
  companyId: string,
  userId: string
) {
  return {
    company: { connect: { uid: companyId } },
    repo: { connect: { uid: data.sourceRepoId } },
    operator: { connect: { uid: userId } },
    auditor: { connect: { uid: userId } },
    type: "DISASSEMBLY" as const,
    desc: toNullableText(data.remark),
    details: {
      deleteMany: {},
      createMany: {
        data: buildDisassemblyDetails(data, companyId)
      }
    }
  };
}

function buildDisassemblyDetails(
  data: CreateDisassemblyOrderDto,
  companyId: string
) {
  const sourceDetail = {
    companyId,
    tireId: data.sourceTireId,
    count: data.quantity,
    desc: toNullableText(data.remark),
    isResult: true
  };
  const componentDetails = data.components.map(component => ({
    companyId,
    tireId: component.tireId,
    count: component.quantity,
    desc: toNullableText(component.remark),
    isResult: false
  }));

  return [sourceDetail, ...componentDetails];
}

export function mapSurplusOrderToOtherInbound(
  item: RawSurplusOrder
): OtherInboundOrder {
  const details = (item.details || []).map(mapOtherInboundDetail);
  return {
    id: item.id,
    uid: item.uid,
    orderNumber: getOrderNumber(item.docNo, item.number, item.uid),
    type: OtherInboundType.SURPLUS,
    status: toOtherInboundStatus(item.isApproved, item.rejectReason),
    providerId: undefined,
    providerName: undefined,
    isApproved: Boolean(item.isApproved),
    isLocked: Boolean(item.isLocked),
    operatorId: item.operatorId,
    operatorName: item.operator?.name,
    auditorId: item.auditorId || undefined,
    auditorName: item.auditor?.name,
    orderDate: normalizeDate(item.createAt),
    approvedAt: undefined,
    totalAmount: calculateTotalAmount(details),
    totalQuantity: calculateTotalQuantity(details),
    remark: item.desc || undefined,
    details,
    createdAt: normalizeDate(item.createAt),
    updatedAt: normalizeDate(item.updateAt)
  };
}

function mapOtherInboundDetail(
  item: RawSurplusOrderDetail
): OtherInboundDetail {
  return {
    id: item.id,
    _uid: item.uid || undefined,
    tireId: item.tireId,
    tireName: item.tire?.name,
    tireBarcode: item.tire?.barcode,
    repoId: item.repoId,
    repoName: item.repo?.name,
    quantity: item.count,
    unitCost: toNumber(item.unitPrice),
    totalCost: toNumber(item.unitPrice) * item.count,
    remark: item.desc || undefined
  };
}

export function buildOtherInboundCreatePayload(
  data: CreateOtherInboundDto,
  companyId: string,
  userId: string
) {
  return {
    order: {
      company: { connect: { uid: companyId } },
      operator: { connect: { uid: userId } },
      auditor: { connect: { uid: userId } },
      desc: toNullableText(data.remark)
    },
    details: buildOtherInboundDetails(data, companyId)
  };
}

export function buildOtherInboundUpdatePayload(
  data: CreateOtherInboundDto,
  companyId: string,
  userId: string
) {
  return {
    company: { connect: { uid: companyId } },
    operator: { connect: { uid: userId } },
    auditor: { connect: { uid: userId } },
    desc: toNullableText(data.remark),
    details: {
      deleteMany: {},
      createMany: {
        data: buildOtherInboundDetails(data, companyId)
      }
    }
  };
}

function buildOtherInboundDetails(
  data: CreateOtherInboundDto,
  companyId: string
) {
  return data.details.map(detail => ({
    companyId,
    repoId: detail.repoId,
    tireId: detail.tireId,
    count: detail.quantity,
    desc: toNullableText(detail.remark)
  }));
}

export function mapWasteOrderToOtherOutbound(
  item: RawWasteOrder
): OtherOutboundOrder {
  const details = (item.details || []).map(mapOtherOutboundDetail);
  return {
    id: item.id,
    uid: item.uid,
    orderNumber: getOrderNumber(item.docNo, item.number, item.uid),
    type: OtherOutboundType.WASTE,
    status: toOtherOutboundStatus(item.isApproved, item.rejectReason),
    customerId: undefined,
    customerName: undefined,
    isApproved: Boolean(item.isApproved),
    isLocked: Boolean(item.isLocked),
    operatorId: item.operatorId,
    operatorName: item.operator?.name,
    auditorId: item.auditorId || undefined,
    auditorName: item.auditor?.name,
    orderDate: normalizeDate(item.createAt),
    approvedAt: undefined,
    totalAmount: calculateTotalAmount(details),
    totalQuantity: calculateTotalQuantity(details),
    remark: item.desc || undefined,
    details,
    createdAt: normalizeDate(item.createAt),
    updatedAt: normalizeDate(item.updateAt)
  };
}

function mapOtherOutboundDetail(
  item: RawWasteOrderDetail
): OtherOutboundDetail {
  return {
    id: item.id,
    _uid: item.uid || undefined,
    tireId: item.tireId,
    tireName: item.tire?.name,
    tireBarcode: item.tire?.barcode,
    repoId: item.repoId,
    repoName: item.repo?.name,
    quantity: item.count,
    unitCost: toNumber(item.unitPrice),
    totalCost: toNumber(item.unitPrice) * item.count,
    remark: undefined
  };
}

export function buildOtherOutboundCreatePayload(
  data: CreateOtherOutboundDto,
  companyId: string,
  userId: string,
  uid: string
) {
  return {
    order: {
      uid,
      company: { connect: { uid: companyId } },
      operator: { connect: { uid: userId } },
      auditor: { connect: { uid: userId } },
      desc: toNullableText(data.remark)
    },
    details: buildOtherOutboundDetails(data, companyId, uid)
  };
}

export function buildOtherOutboundUpdatePayload(
  data: CreateOtherOutboundDto,
  companyId: string,
  userId: string,
  uid: string
) {
  return {
    company: { connect: { uid: companyId } },
    operator: { connect: { uid: userId } },
    auditor: { connect: { uid: userId } },
    desc: toNullableText(data.remark),
    details: {
      deleteMany: {},
      createMany: {
        data: buildOtherOutboundDetails(data, companyId, uid)
      }
    }
  };
}

function buildOtherOutboundDetails(
  data: CreateOtherOutboundDto,
  companyId: string,
  orderId: string
) {
  return data.details.map(detail => ({
    companyId,
    orderId,
    repoId: detail.repoId,
    tireId: detail.tireId,
    count: detail.quantity,
    number: detail._uid || createUid()
  }));
}

export function mapTransferOrderToInventoryDocument(
  item: TransferOrder
): InventoryDocument {
  return {
    id: item.id || 0,
    uid: item.uid,
    orderNumber: getOrderNumber(item.docNo, item.number, item.uid),
    type: DocumentType.TRANSFER,
    status: toDocumentStatus(item.isApproved, item.rejectReason),
    isApproved: item.isApproved,
    operatorName: item.operator?.name,
    auditorName: item.auditor?.name,
    totalAmount: undefined,
    totalQuantity: (item.details || []).reduce(
      (sum, detail) => sum + (detail.count || 0),
      0
    ),
    orderDate: normalizeDate(item.createAt),
    createdAt: normalizeDate(item.createAt),
    remark: item.desc || undefined
  };
}

export function mapInventoryCheckToInventoryDocument(
  item: InventoryCheckTask
): InventoryDocument {
  return {
    id: item.id,
    uid: item.uid,
    orderNumber: item.name || item.uid,
    type: DocumentType.STOCKTAKING,
    status: mapInventoryCheckStatus(item.status),
    isApproved: item.status === "COMPLETED",
    operatorName: item.creatorName,
    auditorName: undefined,
    totalAmount: undefined,
    totalQuantity: item.details?.length || 0,
    orderDate: normalizeDate(item.startedAt || item.createdAt),
    createdAt: normalizeDate(item.createdAt),
    remark: item.remark
  };
}

export function mapAssemblyOrderToInventoryDocument(
  item: RawAssemblyOrder,
  type: DocumentType
): InventoryDocument {
  return {
    id: item.id,
    uid: item.uid || "",
    orderNumber: getOrderNumber(item.docNo, item.number, item.uid),
    type,
    status: toDocumentStatus(item.isApproved, item.rejectReason),
    isApproved: Boolean(item.isApproved),
    operatorName: item.operator?.name,
    auditorName: item.auditor?.name,
    totalAmount: undefined,
    totalQuantity: (item.details || []).reduce(
      (sum, detail) => sum + (detail.count || 0),
      0
    ),
    orderDate: normalizeDate(item.createAt),
    createdAt: normalizeDate(item.createAt),
    remark: item.desc || undefined
  };
}

export function mapOtherInboundToInventoryDocument(
  item: OtherInboundOrder
): InventoryDocument {
  return {
    id: item.id,
    uid: item.uid,
    orderNumber: item.orderNumber,
    type: DocumentType.OTHER_INBOUND,
    status: item.status as unknown as DocumentStatus,
    isApproved: item.isApproved,
    operatorName: item.operatorName,
    auditorName: item.auditorName,
    totalAmount: item.totalAmount,
    totalQuantity: item.totalQuantity,
    orderDate: item.orderDate,
    createdAt: item.createdAt,
    remark: item.remark
  };
}

export function mapOtherOutboundToInventoryDocument(
  item: OtherOutboundOrder
): InventoryDocument {
  return {
    id: item.id,
    uid: item.uid,
    orderNumber: item.orderNumber,
    type: DocumentType.OTHER_OUTBOUND,
    status: item.status as unknown as DocumentStatus,
    isApproved: item.isApproved,
    operatorName: item.operatorName,
    auditorName: item.auditorName,
    totalAmount: item.totalAmount,
    totalQuantity: item.totalQuantity,
    orderDate: item.orderDate,
    createdAt: item.createdAt,
    remark: item.remark
  };
}

export function mapCostAdjustToInventoryDocument(
  item: RawCostAdjustOrder
): InventoryDocument {
  return {
    id: item.id,
    uid: item.uid,
    orderNumber: String(item.number),
    type: DocumentType.COST_ADJUST,
    status: toDocumentStatus(item.isApproved, item.rejectReason),
    isApproved: item.isApproved,
    operatorName: item.operator?.name,
    auditorName: item.auditor?.name,
    totalAmount: toNumber(item.totalAdjustAmount),
    totalQuantity: (item.details || []).reduce(
      (sum, detail) => sum + (detail.count || 0),
      0
    ),
    orderDate: normalizeDate(item.createAt),
    createdAt: normalizeDate(item.createAt),
    remark: item.desc || item.reason
  };
}

export function filterInventoryDocuments(
  items: InventoryDocument[],
  query?: InventoryDocumentFilter
) {
  const filtered = items.filter(item => matchDocument(item, query));
  return filtered.sort(compareDocumentDateDesc);
}

function matchDocument(
  item: InventoryDocument,
  query?: InventoryDocumentFilter
) {
  if (!query) return true;
  if (query.type && item.type !== query.type) return false;
  if (query.status && item.status !== query.status) return false;
  if (!matchDateRange(item, query.startDate, query.endDate)) return false;
  return matchKeyword(item, query.keyword);
}

function matchDateRange(
  item: InventoryDocument,
  startDate?: string,
  endDate?: string
) {
  if (!startDate && !endDate) return true;
  const value = Date.parse(item.orderDate || item.createdAt || "");
  if (Number.isNaN(value)) return false;
  if (startDate && value < Date.parse(startDate)) return false;
  if (endDate && value > Date.parse(`${endDate}T23:59:59.999Z`)) return false;
  return true;
}

function matchKeyword(item: InventoryDocument, keyword?: string) {
  if (!keyword?.trim()) return true;
  const normalized = keyword.trim().toLowerCase();
  return [item.orderNumber, item.remark, item.operatorName, item.auditorName]
    .filter(Boolean)
    .some(value => String(value).toLowerCase().includes(normalized));
}

function compareDocumentDateDesc(a: InventoryDocument, b: InventoryDocument) {
  return (
    getDateValue(b.createdAt || b.orderDate) -
    getDateValue(a.createdAt || a.orderDate)
  );
}

function getDateValue(value?: string) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function findResultDetail(details?: RawAssemblyOrderDetail[]) {
  return (details || []).find(detail => detail.isResult === true);
}

function calculateTotalAmount(
  details: Array<{ unitCost?: number; quantity: number }>
) {
  return details.reduce(
    (sum, detail) => sum + (detail.unitCost || 0) * detail.quantity,
    0
  );
}

function calculateTotalQuantity(details: Array<{ quantity: number }>) {
  return details.reduce((sum, detail) => sum + detail.quantity, 0);
}

function toDisassemblyStatus(
  isApproved?: boolean | null,
  rejectReason?: string | null
) {
  if (rejectReason) return DisassemblyOrderStatus.REJECTED;
  if (isApproved) return DisassemblyOrderStatus.APPROVED;
  return DisassemblyOrderStatus.PENDING;
}

function toAssemblyStatus(
  isApproved?: boolean | null,
  rejectReason?: string | null
) {
  if (rejectReason) return AssemblyOrderStatus.REJECTED;
  if (isApproved) return AssemblyOrderStatus.APPROVED;
  return AssemblyOrderStatus.PENDING;
}

function toOtherInboundStatus(
  isApproved?: boolean | null,
  rejectReason?: string | null
) {
  if (rejectReason) return OtherInboundStatus.REJECTED;
  if (isApproved) return OtherInboundStatus.APPROVED;
  return OtherInboundStatus.PENDING;
}

function toOtherOutboundStatus(
  isApproved?: boolean | null,
  rejectReason?: string | null
) {
  if (rejectReason) return OtherOutboundStatus.REJECTED;
  if (isApproved) return OtherOutboundStatus.APPROVED;
  return OtherOutboundStatus.PENDING;
}

function toDocumentStatus(
  isApproved?: boolean | null,
  rejectReason?: string | null
) {
  if (rejectReason) return DocumentStatus.REJECTED;
  if (isApproved) return DocumentStatus.APPROVED;
  return DocumentStatus.PENDING;
}

function mapInventoryCheckStatus(status: InventoryCheckTask["status"]) {
  if (status === "COMPLETED") return DocumentStatus.COMPLETED;
  if (status === "CANCELLED") return DocumentStatus.CANCELLED;
  return DocumentStatus.PENDING;
}

function getOrderNumber(
  docNo?: string | null,
  number?: NumberLike,
  uid?: string | null
) {
  if (docNo) return docNo;
  if (number !== undefined && number !== null && number !== "") {
    return String(number);
  }
  return uid || "";
}

function normalizeDate(value?: string | null) {
  return value || "";
}

function toNullableText(value?: string) {
  return value?.trim() ? value : null;
}

function toNumber(value: NumberLike) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const ADVANCE_RECEIPT_PREFIX = "/advance-receipt";
const PAYMENT_ORDER_PREFIX = "/payment-order";

export type AdvancePaymentType = "RECEIPT" | "PAYMENT";

export interface AdvancePaymentDto {
  type: AdvancePaymentType;
  targetId: string;
  amount: number;
  paymentId?: string;
  paymentMethod?: string;
  paymentDate?: string;
  remark?: string;
}

export interface AdvancePaymentListItem {
  id: number;
  uid?: string;
  billNo: string;
  type: AdvancePaymentType;
  targetId?: string;
  targetName: string;
  amount: string;
  remainingAmount: string;
  paymentMethod: string;
  remark?: string;
  createTime: string;
  status?: string;
}

export interface AdvancePaymentListResponse {
  list: AdvancePaymentListItem[];
  total: number;
  count?: number;
}

type AdvanceReceiptRow = {
  id: number;
  uid?: string | null;
  customerId: string;
  amount?: string | number | bigint | null;
  balance?: string | number | bigint | null;
  remark?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

type PaymentOrderRow = {
  id: number;
  uid: string;
  providerId: string;
  providerName?: string;
  billNo?: string | null;
  amount?: string | number | null;
  advanceAmount?: string | number | null;
  paymentMethod?: string | null;
  remark?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

function toMoneyString(
  value: string | number | bigint | null | undefined
): string {
  if (value === null || value === undefined) return "0";
  return String(value);
}

function mapReceiptRow(row: AdvanceReceiptRow): AdvancePaymentListItem {
  return {
    id: row.id,
    uid: row.uid ?? undefined,
    billNo: row.uid || String(row.id),
    type: "RECEIPT",
    targetId: row.customerId,
    targetName: "",
    amount: toMoneyString(row.amount),
    remainingAmount: toMoneyString(row.balance),
    paymentMethod: "",
    remark: row.remark ?? "",
    createTime: row.createdAt ?? "",
    status: row.status ?? undefined
  };
}

function mapPaymentRow(row: PaymentOrderRow): AdvancePaymentListItem {
  return {
    id: row.id,
    uid: row.uid,
    billNo: row.billNo || row.uid,
    type: "PAYMENT",
    targetId: row.providerId,
    targetName: row.providerName || "",
    amount: toMoneyString(row.amount),
    remainingAmount: toMoneyString(row.advanceAmount),
    paymentMethod: row.paymentMethod ?? "",
    remark: row.remark ?? "",
    createTime: row.createdAt ?? "",
    status: row.status ?? undefined
  };
}

type AdvancePaymentListResult = CommonResult<AdvancePaymentListResponse>;

function assertAdvancePaymentListResponse<
  T extends { code: number; msg: string }
>(response: T) {
  if (response.code !== 200) {
    throw new Error(response.msg || "预收预付列表加载失败");
  }
}

async function getAdvanceReceiptList(params?: {
  page?: number;
  pageSize?: number;
  targetName?: string;
}): Promise<AdvancePaymentListResult> {
  const response = await http.request<
    CommonResult<{ list: AdvanceReceiptRow[]; count: number }>
  >("get", baseUrlApi(ADVANCE_RECEIPT_PREFIX), {
    params: {
      index: params?.page,
      pageSize: params?.pageSize,
      customerName: params?.targetName
    }
  });
  assertAdvancePaymentListResponse(response);

  const total = response.data?.count ?? 0;
  return {
    ...response,
    data: {
      list: (response.data?.list ?? []).map(mapReceiptRow),
      total,
      count: total
    }
  } satisfies CommonResult<AdvancePaymentListResponse>;
}

async function getPaymentOrderList(params?: {
  page?: number;
  pageSize?: number;
  targetName?: string;
}): Promise<AdvancePaymentListResult> {
  const page = params?.page ?? 1;
  const response = await http.request<
    CommonResult<{ list: PaymentOrderRow[]; count: number }>
  >("get", baseUrlApi(`${PAYMENT_ORDER_PREFIX}/${page}`), {
    params: {
      pageSize: params?.pageSize,
      providerName: params?.targetName,
      advanceOnly: true
    }
  });
  assertAdvancePaymentListResponse(response);

  const total = response.data?.count ?? 0;
  return {
    ...response,
    data: {
      list: (response.data?.list ?? []).map(mapPaymentRow),
      total,
      count: total
    }
  } satisfies CommonResult<AdvancePaymentListResponse>;
}

export async function getAdvancePaymentList(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  targetName?: string;
}): Promise<AdvancePaymentListResult> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const targetName = params?.targetName;

  if (params?.type === "RECEIPT") {
    return getAdvanceReceiptList({ page, pageSize, targetName });
  }

  if (params?.type === "PAYMENT") {
    return getPaymentOrderList({ page, pageSize, targetName });
  }

  const take = page * pageSize;
  const [receiptResponse, paymentResponse] = await Promise.all([
    getAdvanceReceiptList({ page: 1, pageSize: take, targetName }),
    getPaymentOrderList({ page: 1, pageSize: take, targetName })
  ]);

  const total =
    (receiptResponse.data?.total ?? receiptResponse.data?.count ?? 0) +
    (paymentResponse.data?.total ?? paymentResponse.data?.count ?? 0);
  const offset = (page - 1) * pageSize;
  const list = [
    ...(receiptResponse.data?.list ?? []),
    ...(paymentResponse.data?.list ?? [])
  ]
    .sort(
      (a, b) =>
        new Date(b.createTime || 0).getTime() -
        new Date(a.createTime || 0).getTime()
    )
    .slice(offset, offset + pageSize);

  return {
    code: 200,
    msg: "success",
    data: {
      list,
      total,
      count: total
    }
  } satisfies CommonResult<AdvancePaymentListResponse>;
}

export function createAdvancePayment(data: AdvancePaymentDto) {
  if (data.type === "PAYMENT") {
    return http.request<CommonResult<unknown>>(
      "post",
      baseUrlApi(PAYMENT_ORDER_PREFIX),
      {
        data: {
          providerId: data.targetId,
          amount: data.amount,
          paymentId: data.paymentId,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate,
          remark: data.remark,
          details: []
        }
      }
    );
  }

  return http.request<CommonResult<unknown>>(
    "post",
    baseUrlApi(ADVANCE_RECEIPT_PREFIX),
    {
      data: {
        customerId: data.targetId,
        amount: data.amount,
        remark: data.remark
      }
    }
  );
}

export function deleteAdvancePayment(
  id: string,
  type?: AdvancePaymentType,
  uid?: string
) {
  if (type === "PAYMENT") {
    if (!uid) throw new Error("payment order uid is required");
    return http.request<CommonResult<void>>(
      "delete",
      baseUrlApi(`${PAYMENT_ORDER_PREFIX}/${uid}`)
    );
  }

  return http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${ADVANCE_RECEIPT_PREFIX}/${id}`)
  );
}

export function approveAdvancePayment(
  id: string,
  type?: AdvancePaymentType,
  uid?: string
) {
  if (type !== "PAYMENT") {
    throw new Error(
      `approve advance payment only supports PAYMENT, got ${type ?? "UNKNOWN"}`
    );
  }
  if (!uid) throw new Error("payment order uid is required");

  return http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`${PAYMENT_ORDER_PREFIX}/${uid}/approve`)
  );
}

export function writeOffAdvancePayment(data: {
  advanceId: number;
  orderUid: string;
  amount: number;
}) {
  return http.request<CommonResult<void>>(
    "post",
    baseUrlApi(`${ADVANCE_RECEIPT_PREFIX}/${data.advanceId}/use`),
    {
      data: {
        saleOrderUid: data.orderUid,
        amount: data.amount
      }
    }
  );
}

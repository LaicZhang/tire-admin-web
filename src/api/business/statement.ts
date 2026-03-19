import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const RECEIVABLE_STATEMENT_PREFIX = "/receivable-statement";
const PAYABLE_STATEMENT_PREFIX = "/payable-statement";

export type StatementPartyType = "CUSTOMER" | "PROVIDER";

export interface StatementDto {
  type: StatementPartyType;
  targetId: string;
  startDate: string;
  endDate: string;
  openingBalance?: number;
}

export interface Statement {
  id: number;
  uid?: string;
  type: StatementPartyType;
  targetId: string;
  statementNo?: string;
  status?: string;
  targetName?: string;
  amount?: string;
  createTime?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
}

type ReceivableStatementRow = {
  id: number;
  uid?: string | null;
  customerId: string;
  statementNo?: string;
  status?: string;
  closingBalance?: string | number | bigint | null;
  createdAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

type PayableStatementRow = {
  id: number;
  uid?: string | null;
  providerId: string;
  statementNo?: string;
  status?: string;
  closingBalance?: string | number | bigint | null;
  createdAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

function toMoneyString(
  value: string | number | bigint | null | undefined
): string {
  if (value === null || value === undefined) return "0";
  return String(value);
}

function toDateLabel(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function mapReceivableStatement(row: ReceivableStatementRow): Statement {
  return {
    id: row.id,
    uid: row.uid ?? undefined,
    type: "CUSTOMER",
    targetId: row.customerId,
    statementNo: row.statementNo,
    status: row.status,
    amount: toMoneyString(row.closingBalance),
    createTime: row.createdAt ?? "",
    startTime: toDateLabel(row.startDate),
    endTime: toDateLabel(row.endDate),
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined
  };
}

function mapPayableStatement(row: PayableStatementRow): Statement {
  return {
    id: row.id,
    uid: row.uid ?? undefined,
    type: "PROVIDER",
    targetId: row.providerId,
    statementNo: row.statementNo,
    status: row.status,
    amount: toMoneyString(row.closingBalance),
    createTime: row.createdAt ?? "",
    startTime: toDateLabel(row.startDate),
    endTime: toDateLabel(row.endDate),
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined
  };
}

async function getReceivableStatementList(params?: {
  page?: number;
  pageSize?: number;
  targetName?: string;
  status?: string;
}) {
  const response = await http.request<
    CommonResult<{ list: ReceivableStatementRow[]; count: number }>
  >("get", baseUrlApi(RECEIVABLE_STATEMENT_PREFIX), {
    params: {
      index: params?.page,
      pageSize: params?.pageSize,
      customerName: params?.targetName,
      status: params?.status
    }
  });

  if (response.code !== 200) {
    return response as unknown as CommonResult<PaginatedResponseDto<Statement>>;
  }

  const total = response.data?.count ?? 0;
  return {
    ...response,
    data: {
      list: (response.data?.list ?? []).map(mapReceivableStatement),
      total,
      count: total
    }
  } satisfies CommonResult<PaginatedResponseDto<Statement>>;
}

async function getPayableStatementList(params?: {
  page?: number;
  pageSize?: number;
  targetName?: string;
  status?: string;
}) {
  const response = await http.request<
    CommonResult<{ list: PayableStatementRow[]; count: number }>
  >("get", baseUrlApi(PAYABLE_STATEMENT_PREFIX), {
    params: {
      index: params?.page,
      pageSize: params?.pageSize,
      providerName: params?.targetName,
      status: params?.status
    }
  });

  if (response.code !== 200) {
    return response as unknown as CommonResult<PaginatedResponseDto<Statement>>;
  }

  const total = response.data?.count ?? 0;
  return {
    ...response,
    data: {
      list: (response.data?.list ?? []).map(mapPayableStatement),
      total,
      count: total
    }
  } satisfies CommonResult<PaginatedResponseDto<Statement>>;
}

export async function getStatementList(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  targetName?: string;
  status?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const targetName = params?.targetName;
  const status = params?.status;

  if (params?.type === "CUSTOMER") {
    return getReceivableStatementList({ page, pageSize, targetName, status });
  }

  if (params?.type === "PROVIDER") {
    return getPayableStatementList({ page, pageSize, targetName, status });
  }

  const take = page * pageSize;
  const [receivableResponse, payableResponse] = await Promise.all([
    getReceivableStatementList({ page: 1, pageSize: take, targetName, status }),
    getPayableStatementList({ page: 1, pageSize: take, targetName, status })
  ]);

  if (receivableResponse.code !== 200) return receivableResponse;
  if (payableResponse.code !== 200) return payableResponse;

  const total =
    (receivableResponse.data?.total ?? receivableResponse.data?.count ?? 0) +
    (payableResponse.data?.total ?? payableResponse.data?.count ?? 0);
  const offset = (page - 1) * pageSize;
  const list = [
    ...(receivableResponse.data?.list ?? []),
    ...(payableResponse.data?.list ?? [])
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
  } satisfies CommonResult<PaginatedResponseDto<Statement>>;
}

export function createStatement(data: StatementDto) {
  if (data.type === "CUSTOMER") {
    return http.request<CommonResult<Statement>>(
      "post",
      baseUrlApi(`${RECEIVABLE_STATEMENT_PREFIX}/generate`),
      {
        data: {
          customerId: data.targetId,
          startDate: data.startDate,
          endDate: data.endDate,
          openingBalance: data.openingBalance
        }
      }
    );
  }

  return http.request<CommonResult<Statement>>(
    "post",
    baseUrlApi(`${PAYABLE_STATEMENT_PREFIX}/generate`),
    {
      data: {
        providerId: data.targetId,
        startDate: data.startDate,
        endDate: data.endDate,
        openingBalance: data.openingBalance
      }
    }
  );
}

export function confirmStatement(id: string, type: StatementPartyType) {
  const prefix =
    type === "CUSTOMER"
      ? RECEIVABLE_STATEMENT_PREFIX
      : PAYABLE_STATEMENT_PREFIX;
  return http.request<CommonResult<Statement>>(
    "post",
    baseUrlApi(`${prefix}/${id}/confirm`)
  );
}

export function voidStatement(id: string, type: StatementPartyType) {
  const prefix =
    type === "CUSTOMER"
      ? RECEIVABLE_STATEMENT_PREFIX
      : PAYABLE_STATEMENT_PREFIX;
  return http.request<CommonResult<Statement>>(
    "post",
    baseUrlApi(`${prefix}/${id}/dispute`)
  );
}

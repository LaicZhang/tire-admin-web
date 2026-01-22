import type { CommonResult, PaginatedResponseDto } from "../type";

export interface CustomerProductCodeRecord {
  id: number;
  uid: string;
  customerId: string;
  tireId: string;
  customerCode: string;
  customerProductName?: string;
  remark?: string;
  createdAt?: string;
}

export interface CustomerProductCodeQuery {
  customerId?: string;
  tireId?: string;
  keyword?: string;
}

export interface CustomerProductCodeUpsertDto {
  uid?: string;
  customerId: string;
  tireId: string;
  customerCode: string;
  customerProductName?: string;
  remark?: string;
}

const STORAGE_KEY = "data:customer-product-code";

function readAll(): CustomerProductCodeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomerProductCodeRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: CustomerProductCodeRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function nowText() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function getCustomerProductCodeListApi(
  index: number,
  params?: CustomerProductCodeQuery & { pageSize?: number }
): Promise<CommonResult<PaginatedResponseDto<CustomerProductCodeRecord>>> {
  const pageSize = params?.pageSize ?? 10;
  const keyword = (params?.keyword ?? "").trim();

  let list = readAll();
  if (params?.customerId)
    list = list.filter(i => i.customerId === params.customerId);
  if (params?.tireId) list = list.filter(i => i.tireId === params.tireId);
  if (keyword) {
    list = list.filter(
      i =>
        i.customerCode.includes(keyword) ||
        (i.customerProductName ?? "").includes(keyword)
    );
  }

  list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const count = list.length;
  const start = Math.max(0, (index - 1) * pageSize);
  const page = list.slice(start, start + pageSize);

  return {
    code: 200,
    msg: "success",
    data: { total: count, count, list: page }
  };
}

export async function upsertCustomerProductCodeApi(
  dto: CustomerProductCodeUpsertDto
): Promise<CommonResult<CustomerProductCodeRecord>> {
  const list = readAll();
  const uid = dto.uid ?? crypto.randomUUID();
  const existedIndex = list.findIndex(i => i.uid === uid);
  const record: CustomerProductCodeRecord = {
    id: existedIndex >= 0 ? list[existedIndex].id : (list[0]?.id ?? 0) + 1,
    uid,
    customerId: dto.customerId,
    tireId: dto.tireId,
    customerCode: dto.customerCode,
    customerProductName: dto.customerProductName,
    remark: dto.remark,
    createdAt: existedIndex >= 0 ? list[existedIndex].createdAt : nowText()
  };
  if (existedIndex >= 0) list[existedIndex] = record;
  else list.unshift(record);
  writeAll(list);
  return { code: 200, msg: "success", data: record };
}

export async function deleteCustomerProductCodeApi(
  uid: string
): Promise<CommonResult<void>> {
  const list = readAll().filter(i => i.uid !== uid);
  writeAll(list);
  return { code: 200, msg: "success", data: undefined };
}

import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { unsupportedBackendRoute } from "../route-gap";

export interface Unit {
  id: number;
  uid: string;
  name: string;
  symbol: string;
  companyId: string;
}

export interface UnitConversion {
  id: number;
  uid: string;
  sourceUnitId: string;
  targetUnitId: string;
  ratio: number;
  tireId?: string;
  sourceUnit?: Unit;
  targetUnit?: Unit;
}

type UnitPage = {
  list?: Unit[];
  count?: number;
  total?: number;
};

function toPositiveInt(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) {
    return Number(value);
  }
  return null;
}

export async function getUnitListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult>("get", baseUrlApi("/unit"), {
    params: { ...params, index }
  });
}

/** GET /unit?index=。/unit/all 会被 unit/:id 的 ParseIntPipe 吃掉。 */
export async function getAllUnitsApi() {
  const collected: Unit[] = [];
  let expected = Number.POSITIVE_INFINITY;
  let code = 200;
  let msg = "";

  for (let index = 1; collected.length < expected && index <= 50; index += 1) {
    const result = await http.request<{
      code: number;
      msg?: string;
      data?: UnitPage | Unit[];
    }>("get", baseUrlApi("/unit"), { params: { index } });
    code = result.code;
    msg = typeof result.msg === "string" ? result.msg : "";
    const data = result.data;
    if (Array.isArray(data)) {
      return { code, msg, data };
    }
    const list = Array.isArray(data?.list) ? data.list : [];
    const count =
      typeof data?.count === "number"
        ? data.count
        : typeof data?.total === "number"
          ? data.total
          : list.length;
    expected = count;
    collected.push(...list);
    if (list.length === 0) break;
  }

  return { code, msg, data: collected };
}

export async function createUnitApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi("/unit"), {
    data
  });
}

export async function deleteUnitApi(id: number) {
  return await http.request<CommonResult>("delete", baseUrlApi("/unit/" + id));
}

export async function updateUnitApi(id: number, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi("/unit/" + id), {
    data
  });
}

export async function getUnitConversionsApi(_tireId?: string) {
  const result = await http.request<{
    data: UnitConversion[] | { list?: UnitConversion[] };
    code: number;
    msg?: string;
  }>("get", baseUrlApi("/unit/conversion"));
  const data = result.data;
  const list = Array.isArray(data) ? data : (data?.list ?? []);
  return { ...result, data: list };
}

export async function createUnitConversionApi(data: {
  sourceUnitId?: string | number;
  targetUnitId?: string | number;
  fromUnitId?: string | number;
  toUnitId?: string | number;
  ratio: number;
  tireId?: string;
}) {
  const fromUnitId = toPositiveInt(data.fromUnitId ?? data.sourceUnitId);
  const toUnitId = toPositiveInt(data.toUnitId ?? data.targetUnitId);
  if (fromUnitId == null || toUnitId == null || typeof data.ratio !== "number") {
    return unsupportedBackendRoute(
      "POST /unit/conversion requires integer fromUnitId/toUnitId"
    );
  }
  return await http.request<{ data: UnitConversion; code: number }>(
    "post",
    baseUrlApi("/unit/conversion"),
    { data: { fromUnitId, toUnitId, ratio: data.ratio } }
  );
}

export async function deleteUnitConversionApi(uid: string) {
  const id = toPositiveInt(uid);
  if (id == null) {
    return unsupportedBackendRoute("DELETE /unit/conversion/:id");
  }
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi("/unit/conversion/" + id)
  );
}

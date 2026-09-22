import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import {
  deleteRepoZoneApi,
  getRepoZoneListApi,
  lockRepoBinApi
} from "../business/stock";
import { getStorageZoneListApi } from "../business/storage";
import {
  createUnitConversionApi,
  getAllUnitsApi
} from "../business/unit";
import {
  deleteCodeRuleApi,
  getCodeRulesApi,
  saveCodeRuleApi
} from "../setting/code-rule";
import { setDefaultTemplateApi } from "../setting/print-template";
import { getCustomerDebtProfileApi } from "../business/customer";
import {
  getAccountBalanceApi,
  getContactDebtListApi,
  getFundFlowListApi
} from "../fund/statement";
import {
  createIncomeExpenseItemApi,
  deleteIncomeExpenseItemApi,
  getIncomeExpenseItemListApi
} from "../finance";
import {
  getTraceWorkbenchDetailApi,
  getTraceWorkbenchListApi
} from "../dashboard";
import { getPriceListListApi } from "../business/price";
import { updateBatchApi } from "../batch";

vi.mock("@/utils/http", () => ({
  http: {
    request: vi.fn()
  }
}));

const here = dirname(fileURLToPath(import.meta.url));

describe("T3-X-002 route alignment", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({
      code: 200,
      data: { count: 2, list: [{ id: 1 }] }
    });
  });

  it("lists storage zones on the real route and fills total from count", async () => {
    const result = await getRepoZoneListApi(2, { repoId: "repo-1" });

    expect(http.request).toHaveBeenCalledWith("get", "/api/v1/storage-zone", {
      params: { repoId: "repo-1", index: 2 }
    });
    expect(result.data?.total).toBe(2);
    expect(result.data?.count).toBe(2);
  });

  it("drops the storage-zone trailing slash", async () => {
    await getStorageZoneListApi({ name: "A" });

    expect(http.request).toHaveBeenCalledWith("get", "/api/v1/storage-zone", {
      params: { name: "A" }
    });
  });

  it("rejects zone delete and bin lock without calling http", async () => {
    await expect(deleteRepoZoneApi("zone-1")).rejects.toThrow(/storage-zone/);
    await expect(
      lockRepoBinApi({ id: "bin-1", reason: "盘点" })
    ).rejects.toThrow(/storage-location/);
    expect(http.request).not.toHaveBeenCalled();
  });

  it("loads units from GET /unit and unwraps one full page", async () => {
    vi.mocked(http.request).mockResolvedValue({
      code: 200,
      msg: "success",
      data: { count: 1, list: [{ id: 1, name: "条" }] }
    });

    const result = await getAllUnitsApi();

    expect(http.request).toHaveBeenCalledTimes(1);
    expect(http.request).toHaveBeenCalledWith("get", "/api/v1/unit", {
      params: { index: 1 }
    });
    expect(result.data).toEqual([{ id: 1, name: "条" }]);
  });

  it("posts integer unit conversions and rejects non-integer ids", async () => {
    await createUnitConversionApi({
      sourceUnitId: "12",
      targetUnitId: "3",
      ratio: 2.5,
      tireId: "tire-1"
    });

    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/unit/conversion",
      { data: { fromUnitId: 12, toUnitId: 3, ratio: 2.5 } }
    );

    vi.mocked(http.request).mockClear();
    await expect(
      createUnitConversionApi({
        sourceUnitId: "uid-1",
        targetUnitId: "3",
        ratio: 1
      })
    ).rejects.toThrow(/fromUnitId/);
    expect(http.request).not.toHaveBeenCalled();
  });

  it("maps document-number rules onto the code-rule page shape", async () => {
    vi.mocked(http.request).mockResolvedValue({
      code: 200,
      msg: "success",
      data: [
        {
          documentType: "SALE",
          prefix: "SO",
          sequenceDigits: 4,
          resetMonthly: true
        }
      ]
    });

    const result = await getCodeRulesApi();
    const row = (result.data as Array<Record<string, unknown>>)[0];

    expect(http.request).toHaveBeenCalledWith(
      "get",
      "/api/v1/document-number/rules"
    );
    expect(row).toMatchObject({
      uid: "SALE",
      targetCode: "SALE",
      targetType: "document",
      serialDigits: 4,
      resetType: "monthly"
    });
  });

  it("saves only whitelisted document-number fields", async () => {
    await saveCodeRuleApi({
      name: "销售单",
      targetType: "document",
      targetCode: "SALE",
      prefix: "SO",
      dateFormat: "yyyyMMdd",
      serialDigits: 4,
      serialStart: 1,
      resetType: "monthly",
      autoFillGap: true,
      allowManualEdit: true
    });

    const body = vi.mocked(http.request).mock.calls[0]?.[2]?.data;
    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/document-number/rule",
      {
        data: {
          documentType: "SALE",
          prefix: "SO",
          dateFormat: "yyyyMMdd",
          sequenceDigits: 4,
          resetMonthly: true
        }
      }
    );
    expect(body).not.toHaveProperty("name");
    expect(body).not.toHaveProperty("serialStart");
    expect(body).not.toHaveProperty("autoFillGap");
    expect(body).not.toHaveProperty("targetCode");
  });

  it("rejects page snake_case document types without calling http", async () => {
    await expect(
      saveCodeRuleApi({ targetCode: "purchase_order", prefix: "PO" })
    ).rejects.toThrow(/document-number/);
    expect(http.request).not.toHaveBeenCalled();
  });

  it("deletes a document-number rule by document type", async () => {
    await deleteCodeRuleApi("SALE");

    expect(http.request).toHaveBeenCalledWith(
      "delete",
      "/api/v1/document-number/rule/SALE"
    );
  });

  it("rejects print template default without freezing the list route", async () => {
    await expect(setDefaultTemplateApi("tpl-1")).rejects.toThrow(
      /print-template/
    );
    expect(http.request).not.toHaveBeenCalled();
  });

  it("rejects the dead debt-profile GET", async () => {
    await expect(getCustomerDebtProfileApi("customer-1")).rejects.toThrow(
      /debt-profile/
    );
    expect(http.request).not.toHaveBeenCalled();
  });

  it("rejects statement, finance item, trace, price, and batch update routes", async () => {
    await expect(getFundFlowListApi(1)).rejects.toThrow(/statement/);
    await expect(getAccountBalanceApi()).rejects.toThrow(/account-balance/);
    await expect(getContactDebtListApi(1)).rejects.toThrow(/contact-debt/);
    await expect(getIncomeExpenseItemListApi(1)).rejects.toThrow(
      /finance-extension\/item/
    );
    await expect(
      createIncomeExpenseItemApi({ name: "运费", type: "expense" })
    ).rejects.toThrow(/finance-extension\/item/);
    await expect(deleteIncomeExpenseItemApi(1)).rejects.toThrow(
      /finance-extension\/item/
    );
    await expect(getTraceWorkbenchListApi(1)).rejects.toThrow(/trace-workbench/);
    await expect(getTraceWorkbenchDetailApi("inc-1")).rejects.toThrow(
      /trace-workbench/
    );
    await expect(getPriceListListApi(1)).rejects.toThrow(/\/price\//);
    await expect(updateBatchApi(1, { quantity: 1 })).rejects.toThrow(/batch/);
    expect(http.request).not.toHaveBeenCalled();
  });

  it("does not keep the removed dead deletes in the pages", () => {
    const documents = readFileSync(
      resolve(here, "../../views/fund/documents/index.vue"),
      "utf8"
    );
    const report = readFileSync(
      resolve(here, "../../views/inventory/report/index.vue"),
      "utf8"
    );
    expect(documents).not.toMatch(/http\.delete\(/);
    expect(documents).toContain("unsupportedBackendRoute(");
    expect(report).not.toMatch(/http\.request\(/);
    expect(report).not.toContain("/api/v1/inventory-report");
    expect(report).toContain("unsupportedBackendRoute(");
  });
});

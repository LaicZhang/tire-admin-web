/**
 * T3-X-002 C 类（运行时计算路径）路由探针。
 *
 * 对审计列为「静态不可判定」的 5 组 API（monitor 双模式前缀、order 泛型
 * getOrderPrefix、subscription companyGrantsPrefix、print-template 三元
 * 分支、crud-factory 与 data/* 运行时分支）逐一以 mock http 调用，捕获实际
 * 产出的 (method, url)，并与 be-core 后端路由快照
 * `../be-core/docs/audit-list/api-contract-snapshot.json` 做参数化比对。
 *
 * 工作区外（如独立 CI 无 be-core 邻居目录）自动 skip。
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";

vi.mock("@/utils/http", () => ({
  http: {
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

const SNAPSHOT_PATH = resolve(
  __dirname,
  "../../../../be-core/docs/audit-list/api-contract-snapshot.json"
);

type BackendRoute = { method: string; path: string };

function loadBackendRoutes(): Set<string> {
  const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as {
    backend: BackendRoute[];
  };
  // 参数段归一化：:param 与具体值都映射为占位符
  const normalize = (p: string) =>
    p
      .split("/")
      .map(seg => (seg.startsWith(":") ? "{}" : seg))
      .join("/");
  return new Set(
    raw.backend.map(r => `${r.method.toUpperCase()} ${normalize(r.path)}`)
  );
}

function normalizeFrontendUrl(url: string): string {
  const stripped = url.replace(/^\/api\/v1/, "").split("?")[0];
  const normalized = stripped
    .split("/")
    .map(seg => seg)
    .join("/");
  // Nest/Express registers controller paths without a trailing slash and
  // accepts the slash-tolerant form at runtime. Compare the route identity,
  // not this harmless serialization difference.
  return normalized.replace(/\/+$/, "") || "/";
}

/** 将前端具体 URL 与后端路由表匹配（段数一致 + 字面段相同 + 参数段通配） */
function matchesBackend(
  routes: Set<string>,
  method: string,
  url: string
): boolean {
  const frontSegs = normalizeFrontendUrl(url).split("/");
  for (const entry of routes) {
    const [m, p] = entry.split(" ");
    if (m !== method.toUpperCase()) continue;
    const backSegs = p.split("/");
    if (backSegs.length !== frontSegs.length) continue;
    const ok = backSegs.every((seg, i) => seg === "{}" || seg === frontSegs[i]);
    if (ok) return true;
  }
  return false;
}

const calls: Array<{ method: string; url: string }> = [];

function record(method: string, url: string) {
  calls.push({ method, url });
  return Promise.resolve({ code: 200, msg: "success", data: [] });
}

beforeEach(() => {
  calls.length = 0;
  vi.mocked(http.request).mockReset();
  vi.mocked(http.request).mockImplementation((m, u) => record(m, u));
  for (const verb of ["get", "post", "patch", "delete"] as const) {
    vi.mocked(http[verb]).mockReset();
    vi.mocked(http[verb]).mockImplementation((u: string) => record(verb, u));
  }
});

describe("T3-X-002 C 类运行时路由探针", () => {
  it.runIf(existsSync(SNAPSHOT_PATH))(
    "所有 C 类产出的 (method,url) 命中后端路由表",
    async () => {
      const monitor = await import("../monitor");
      const subscription = await import("../system/subscription");
      const printTemplate = await import("../setting/print-template");
      const order = await import("../business/order");
      const tire = await import("../business/tire");
      const customer = await import("../business/customer");
      const provider = await import("../business/provider");
      const customerProductCode = await import("../data/customer-product-code");
      const initialStock = await import("../data/initial-stock");
      const initialBalance = await import("../data/initial-balance");
      const priceRule = await import("../data/price-rule");
      const columnSettings = await import("../data/column-settings");
      const priceInfo = await import("../data/price-info");
      const priceLimit = await import("../data/price-limit");

      for (const mode of ["platform", "company"] as const) {
        await monitor.getMonitorOverviewApi(mode);
        await monitor.getMonitorBusinessApi(mode);
        await monitor.getMonitorOperationLogsApi(mode);
        await monitor.getMonitorOperationLogDetailApi(mode, 1);
        await monitor.getMonitorLoginLogsApi(mode);
        await monitor.getMonitorSensitiveLogsApi(mode);
        await monitor.getMonitorCompaniesApi(mode);
        await monitor.getMonitorEmployeesApi(mode);
        await monitor.getMonitorMoneyApi(mode);
        await monitor.getMonitorSystemHealthApi(mode);
        await monitor.getMonitorCronRunsApi(mode);
        await monitor.exportMonitorCsvApi(mode);
      }

      await subscription.listCompanyPlanGrantsApi("company-1");
      await subscription.grantCompanyPlanApi("company-1", {
        planUid: "p1"
      } as never);
      await subscription.revokeCompanyPlanApi("company-1");

      await expect(printTemplate.getPrintTemplatesApi()).rejects.toThrow(
        "GET /print-template/list"
      );
      await expect(
        printTemplate.getPrintTemplatesApi("purchase_order")
      ).rejects.toThrow("GET /print-template/list");

      for (const type of [
        "purchase-order",
        "purchase-inbound",
        "return-order",
        "sale-order",
        "sale-outbound",
        "claim-order"
      ]) {
        await order.getOrderListApi(type, 1);
        await order.addOrderApi(type, {} as never);
        await order.getOrderApi(type, "uid-1");
        await order.updateOrderApi(type, "uid-1", {} as never);
        await order.deleteOrderApi(type, "uid-1");
      }

      // Supplier claim orders are read through the generic list/detail
      // endpoints, but creation/update/delete are intentionally exposed via
      // dedicated lifecycle APIs because the backend has no generic routes.
      await order.getOrderListApi("supplier-claim-order", 1);
      await order.getOrderApi("supplier-claim-order", "uid-1");

      await tire.getTireListApi(1);
      await tire.addTireApi({} as never);
      await tire.getTireApi("uid-1");
      await tire.updateTireApi("uid-1", {});
      await tire.deleteTireApi("uid-1");
      await tire.getTireBatchApi(["uid-1"]);

      await customer.getCustomerListApi(1);
      await customer.addCustomerApi({} as never);
      await customer.getCustomerApi("uid-1");
      await customer.updateCustomerApi("uid-1", {});
      await customer.deleteCustomerApi("uid-1");
      await customer.restoreCustomerApi("uid-1");
      await customer.getCustomerBatchApi(["uid-1"]);

      await provider.getProviderListApi(1);
      await provider.addProviderApi({} as never);
      await provider.getProviderApi("uid-1");
      await provider.updateProviderApi("uid-1", {});
      await provider.deleteProviderApi("uid-1");

      await customerProductCode.getCustomerProductCodeListApi(1);
      await customerProductCode.upsertCustomerProductCodeApi({} as never);
      await customerProductCode.upsertCustomerProductCodeApi({
        uid: "uid-1"
      } as never);
      await customerProductCode.deleteCustomerProductCodeApi("uid-1");

      await initialStock.getInitialStockListApi(1);
      await initialStock.upsertInitialStockApi({} as never);
      await initialStock.upsertInitialStockApi({ uid: "uid-1" } as never);
      await initialStock.deleteInitialStockApi("uid-1");

      await initialBalance.createInitialBalanceApi({
        type: "customer",
        amount: 1,
        date: "2026-09-25"
      });
      await initialBalance.getInitialBalanceListApi(1);
      await initialBalance.getInitialBalanceBatchApi({ types: ["customer"] });

      await priceRule.getPriceRuleConfigApi();
      await priceRule.savePriceRuleConfigApi({} as never);

      await columnSettings.getColumnSettingsApi("order");
      await columnSettings.saveColumnSettingsApi("order", [] as never);
      await columnSettings.clearColumnSettingsApi("order");

      await priceInfo.upsertPriceInfoApi({} as never);

      await priceLimit.getPriceLimitListApi(1);
      await priceLimit.upsertPriceLimitApi({} as never);
      await priceLimit.deletePriceLimitApi("uid-1");

      expect(calls.length).toBeGreaterThan(0);
      const routes = loadBackendRoutes();
      const misses = calls.filter(
        c => !matchesBackend(routes, c.method, c.url)
      );
      expect(
        misses,
        `未命中后端路由的前端调用：\n${misses
          .map(c => `${c.method.toUpperCase()} ${c.url}`)
          .join("\n")}`
      ).toEqual([]);
    },
    30_000
  );
});

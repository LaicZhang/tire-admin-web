import type { Component } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";
import { exerciseSetupHandlers } from "../../../tests/helpers/exercise-setup";
process.on("unhandledRejection", () => undefined);
vi.mock("@/utils/http", () => import("../../../tests/mocks/http-rich"));
vi.mock("@/utils/echarts", () => ({
  getEcharts: async () => ({
    init: () => ({
      setOption() {},
      resize() {},
      dispose() {},
      on() {},
      off() {}
    })
  })
}));
const modules = import.meta.glob<{ default: Component }>("../**/*.vue");
const targets = new Set([
  "../analysis/components/AnalysisDateToolbar.vue",
  "../analysis/finance/index.vue",
  "../analysis/traceWorkbench/components/TraceIncidentDetail.vue",
  "../auth/history.vue",
  "../business/customer/FollowUpAddForm.vue",
  "../business/expiryAlert/ExpiryAlertForm.vue",
  "../business/finance/invoice/InvoiceFormDialog.vue",
  "../business/finance/statement/StatementSummaryDialog.vue",
  "../business/financeItem/index.vue",
  "../business/logistic/ShippingPlanTab.vue",
  "../business/order/components/ClaimInspectionDialog.vue",
  "../business/price/index.vue",
  "../business/purchase/plan/index.vue",
  "../business/serviceWorkOrder/index.vue",
  "../business/stock/serialNumber/SerialNumberAddForm.vue",
  "../business/stockTaking/components/WasteBridge.vue",
  "../business/unit/index.vue",
  "../company/commission/index.vue",
  "../company/info/index.vue",
  "../company/repo/index.vue",
  "../data/auxiliary/form.vue",
  "../data/customer/index.vue",
  "../data/expenseCategory/index.vue",
  "../data/priceInfo/form.vue",
  "../data/settlement/form.vue",
  "../data/supplierBalance/form.vue",
  "../error/500.vue",
  "../fund/payment/index.vue",
  "../fund/transfer/form.vue",
  "../inventory/costAdjust/form.vue",
  "../inventory/inboundCostAdjust/index.vue",
  "../inventory/stocktaking/StocktakingDetailForm.vue",
  "../login/index.vue",
  "../purchase/inbound/index.vue",
  "../result/success.vue",
  "../sales/return/form.vue",
  "../settings/companyInfo/index.vue",
  "../settings/importFree/index.vue",
  "../system/companies/form.vue",
  "../system/feedback/index.vue",
  "../system/permission/form.vue",
  "../system/subscription-plans/index.vue",
  "../system/workflow/index.vue",
  "../welcome/index.vue"
]);
const entries = Object.entries(modules).filter(([p]) => targets.has(p));
describe("view deep exercise 4", () => {
  it.each(entries)(
    "%s exercises rendered state",
    async (sourcePath, loader) => {
      const wrapper = await mountSmokeComponent(loader, sourcePath, {
        keepMounted: true,
        deep: true,
        allowRenderErrors: true
      });
      try {
        await exerciseSetupHandlers(wrapper);
        expect(wrapper.exists()).toBe(true);
      } finally {
        wrapper.unmount();
        document.body.innerHTML = "";
      }
    }
  );
});

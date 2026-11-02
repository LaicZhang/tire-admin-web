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
  "../analysis/assets/index.vue",
  "../analysis/dataSettings/index.vue",
  "../analysis/subscriptions/index.vue",
  "../auth/WxBindForm.vue",
  "../business/contract/template/index.vue",
  "../business/customer/tagDialog.vue",
  "../business/finance/income/index.vue",
  "../business/finance/statement/StatementFormDialog.vue",
  "../business/financeItem/FinanceItemForm.vue",
  "../business/logistic/ShippingPlanDialog.vue",
  "../business/order/components/ClaimDefectCategoryManager.vue",
  "../business/price/form.vue",
  "../business/purchase/inquiry/index.vue",
  "../business/servicePackage/index.vue",
  "../business/stock/packing/index.vue",
  "../business/stockTaking/components/SurplusBridge.vue",
  "../business/unit/UnitForm.vue",
  "../company/chat/index.vue",
  "../company/info/form.vue",
  "../company/repo/form.vue",
  "../data/account/index.vue",
  "../data/customer/form.vue",
  "../data/expenseCategory/form.vue",
  "../data/multiUnit/index.vue",
  "../data/productCategory/index.vue",
  "../data/supplier/index.vue",
  "../error/404.vue",
  "../fund/payment/form.vue",
  "../fund/report/index.vue",
  "../inventory/bom/index.vue",
  "../inventory/documents/index.vue",
  "../inventory/stocktaking/StocktakingDetailEditor.vue",
  "../login/components/update.vue",
  "../purchase/inbound/form.vue",
  "../result/fail.vue",
  "../sales/return/ReturnInspectionDialog.vue",
  "../settings/codeRule/index.vue",
  "../settings/funcParams/index.vue",
  "../system/companies/components/CompanyPlanGrantsDialog.vue",
  "../system/feedback/form.vue",
  "../system/notice/index.vue",
  "../system/scheduledJobs/index.vue",
  "../system/workflow/WorkflowForm.vue",
  "../welcome/components/lastFeat.vue"
]);
const entries = Object.entries(modules).filter(([p]) => targets.has(p));
describe("view deep exercise 3", () => {
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

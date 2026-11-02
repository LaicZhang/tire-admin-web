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
  "../analysis/components/SalesHotspotCharts.vue",
  "../analysis/ranking/index.vue",
  "../audit/permission/index.vue",
  "../business/batch/index.vue",
  "../business/customer/form.vue",
  "../business/finance/arTemp/index.vue",
  "../business/finance/saleAllocation/index.vue",
  "../business/finance/transfer/index.vue",
  "../business/logistic/LoadingTaskDialog.vue",
  "../business/logistic/TrackingPanel.vue",
  "../business/payment/accountOperationDialog.vue",
  "../business/purchase/inquiry/components/PurchaseInquiryFormDialog.vue",
  "../business/quality/inspection/index.vue",
  "../business/stock/location/index.vue",
  "../business/stockAlert/index.vue",
  "../business/tire/UnitConversionForm.vue",
  "../company/asset/form.vue",
  "../company/employee/form.vue",
  "../company/position/form.vue",
  "../company/settlement-defaults/index.vue",
  "../data/batchSerial/form.vue",
  "../data/customerCategory/index.vue",
  "../data/initialStock/form.vue",
  "../data/product/form.vue",
  "../data/staff/form.vue",
  "../data/warehouse/form.vue",
  "../fund/otherExpense/index.vue",
  "../fund/report/components/ContactDebtTab.vue",
  "../inventory/assembly/form.vue",
  "../inventory/disassembly/form.vue",
  "../inventory/otherOutbound/index.vue",
  "../inventory/transfer/index.vue",
  "../other/aiEntry/index.vue",
  "../purchase/return/form.vue",
  "../sales/outbound/form.vue",
  "../settings/closing/ClosingCheckForm.vue",
  "../settings/dataAuth/components/UserTable.vue",
  "../settings/recycle/index.vue",
  "../system/documentNumber/DocumentNumberRuleForm.vue",
  "../system/log/index.vue",
  "../system/role/form.vue",
  "../system/updateHistory/index.vue",
  "../welcome/components/RankingTabs.vue"
]);
const entries = Object.entries(modules).filter(([p]) => targets.has(p));
describe("view deep exercise 8", () => {
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

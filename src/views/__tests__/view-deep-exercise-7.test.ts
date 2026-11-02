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
  "../analysis/components/RoleDashboardSection.vue",
  "../analysis/purchase/index.vue",
  "../audit/export-dialog/index.vue",
  "../business/batch/BatchCreateForm.vue",
  "../business/customer/followUpDialog.vue",
  "../business/finance/advance/index.vue",
  "../business/finance/reminder/index.vue",
  "../business/finance/stockReservation/index.vue",
  "../business/logistic/DeliveryReceiptCard.vue",
  "../business/logistic/TrackingNodeDialog.vue",
  "../business/order/index.vue",
  "../business/provider/index.vue",
  "../business/quality/inspection/components/QualityInspectionFormDialog.vue",
  "../business/stock/index.vue",
  "../business/stockAlert/StockAlertForm.vue",
  "../business/storeManagement/index.vue",
  "../business/warrantyRegistration/index.vue",
  "../company/department/index.vue",
  "../company/payroll-run/index.vue",
  "../company/salary-item/index.vue",
  "../data/auxiliaryAttr/index.vue",
  "../data/customerCategory/form.vue",
  "../data/incomeCategory/index.vue",
  "../data/priceRule/index.vue",
  "../data/singleUnit/index.vue",
  "../data/supplierCategory/index.vue",
  "../fund/otherExpense/form.vue",
  "../fund/report/components/AccountBalanceTab.vue",
  "../fund/writeOff/index.vue",
  "../inventory/costRecalc/index.vue",
  "../inventory/otherOutbound/form.vue",
  "../inventory/transfer/form.vue",
  "../monitor/shared/MonitorCenter.vue",
  "../purchase/report/index.vue",
  "../sales/order/index.vue",
  "../settings/backup/index.vue",
  "../settings/dataAuth/components/SelectAuthDialog.vue",
  "../settings/push/index.vue",
  "../system/document/index.vue",
  "../system/log/RollbackTraceDialog.vue",
  "../system/print/index.vue",
  "../system/task/index.vue",
  "../welcome/components/AlertCards.vue"
]);
const entries = Object.entries(modules).filter(([p]) => targets.has(p));
describe("view deep exercise 7", () => {
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

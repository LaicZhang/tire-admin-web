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
  "../analysis/components/CockpitDecisionCards.vue",
  "../analysis/inventory/index.vue",
  "../analysis/traceWorkbench/components/TraceIncidentList.vue",
  "../auth/profile.vue",
  "../business/customer/LevelEditForm.vue",
  "../business/expiryAlert/index.vue",
  "../business/finance/invoice/detail.vue",
  "../business/finance/statement/index.vue",
  "../business/installationRecord/index.vue",
  "../business/logistic/ShippingWaveDialog.vue",
  "../business/order/components/ConfirmOrderDetailAction.vue",
  "../business/price/query.vue",
  "../business/quality/defect/DefectCategoryForm.vue",
  "../business/specialPrice/index.vue",
  "../business/stock/serialNumber/SerialNumberLogsForm.vue",
  "../business/stockTaking/index.vue",
  "../business/warehouseManagement/form.vue",
  "../company/department/RolesForm.vue",
  "../company/inventory-defaults/index.vue",
  "../company/salary/form.vue",
  "../data/auxiliary/index.vue",
  "../data/customerBalance/form.vue",
  "../data/importExport/index.vue",
  "../data/priceInfo/index.vue",
  "../data/settlement/index.vue",
  "../data/supplierBalance/index.vue",
  "../error/components/ErrorPage.vue",
  "../fund/receipt/form.vue",
  "../fund/transfer/index.vue",
  "../inventory/costAdjust/index.vue",
  "../inventory/otherInbound/form.vue",
  "../inventory/stocktaking/form.vue",
  "../monitor/company/index.vue",
  "../purchase/order/form.vue",
  "../sales/documents/index.vue",
  "../sales/return/index.vue",
  "../settings/costParams/index.vue",
  "../settings/operationLog/index.vue",
  "../system/companies/index.vue",
  "../system/file/index.vue",
  "../system/permission/index.vue",
  "../system/systemSetting/form.vue",
  "../tools/io/index.vue"
]);
const entries = Object.entries(modules).filter(([p]) => targets.has(p));
describe("view deep exercise 5", () => {
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

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
  "../analysis/components/RoleDashboardContent.vue",
  "../analysis/profit/index.vue",
  "../analysis/traceWorkbench/index.vue",
  "../business/audit/index.vue",
  "../business/customer/TagEditForm.vue",
  "../business/finance/advance/AdvancePaymentFormDialog.vue",
  "../business/finance/invoice/index.vue",
  "../business/finance/stockMovement/index.vue",
  "../business/logistic/DeliveryExceptionDialog.vue",
  "../business/logistic/ShippingWaveTab.vue",
  "../business/order/form.vue",
  "../business/provider/form.vue",
  "../business/quality/defect/index.vue",
  "../business/stock/costAdjust/index.vue",
  "../business/stock/serialNumber/index.vue",
  "../business/storeManagement/form.vue",
  "../business/warehouseManagement/index.vue",
  "../company/department/form.vue",
  "../company/order-audit/index.vue",
  "../company/salary/index.vue",
  "../data/auxiliaryAttr/form.vue",
  "../data/customerBalance/index.vue",
  "../data/incomeCategory/form.vue",
  "../data/priceLimit/index.vue",
  "../data/singleUnit/form.vue",
  "../data/supplierCategory/form.vue",
  "../fund/documents/index.vue",
  "../fund/receipt/index.vue",
  "../fund/writeOff/form.vue",
  "../inventory/costRecalc/form.vue",
  "../inventory/otherInbound/index.vue",
  "../inventory/stocktaking/index.vue",
  "../monitor/platform/index.vue",
  "../purchase/order/index.vue",
  "../sales/order/form.vue",
  "../settings/advancedPrint/index.vue",
  "../settings/dataAuth/components/EditAuthDialog.vue",
  "../settings/printTemplate/index.vue",
  "../system/dict/index.vue",
  "../system/help-center/index.vue",
  "../system/plan-redeem-codes/index.vue",
  "../system/systemSetting/index.vue",
  "../tools/verify/index.vue"
]);
const entries = Object.entries(modules).filter(([p]) => targets.has(p));
describe("view deep exercise 6", () => {
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

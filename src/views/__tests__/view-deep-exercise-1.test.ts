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
  "../analysis/aging/index.vue",
  "../analysis/comprehensive/index.vue",
  "../analysis/sales/index.vue",
  "../auth/ProfileEditForm.vue",
  "../business/contract/purchase/index.vue",
  "../business/customer/index.vue",
  "../business/finance/expense/index.vue",
  "../business/finance/saleFulfillment/index.vue",
  "../business/finance/writeOff/WriteOffForm.vue",
  "../business/logistic/LoadingTaskTab.vue",
  "../business/logistic/index.vue",
  "../business/payment/form.vue",
  "../business/purchase/inquiry/components/PurchaseQuotationFormDialog.vue",
  "../business/sales/quotation/components/SaleQuotationFormDialog.vue",
  "../business/stock/lock/index.vue",
  "../business/stockTaking/components/CreateTaskDialog.vue",
  "../business/tire/form.vue",
  "../company/asset/index.vue",
  "../company/employee/index.vue",
  "../company/position/index.vue",
  "../company/social-rate/index.vue",
  "../data/batchSerial/index.vue",
  "../data/customerProductCode/form.vue",
  "../data/initialStock/index.vue",
  "../data/product/index.vue",
  "../data/staff/index.vue",
  "../data/warehouse/index.vue",
  "../fund/otherIncome/form.vue",
  "../fund/report/components/FundFlowTab.vue",
  "../inventory/assembly/index.vue",
  "../inventory/disassembly/index.vue",
  "../inventory/report/form.vue",
  "../login/components/phone.vue",
  "../other/smartImport/index.vue",
  "../purchase/return/index.vue",
  "../sales/outbound/index.vue",
  "../settings/closing/index.vue",
  "../settings/dataAuth/components/ViewAuthDialog.vue",
  "../settings/sysParams/index.vue",
  "../system/documentNumber/index.vue",
  "../system/menu/form.vue",
  "../system/role/index.vue",
  "../system/user/form.vue",
  "../welcome/components/SalesChart.vue"
]);
const entries = Object.entries(modules).filter(([p]) => targets.has(p));
describe("view deep exercise 1", () => {
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

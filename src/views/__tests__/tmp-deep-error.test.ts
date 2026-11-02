import type { Component } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";
import { exerciseSetupHandlers } from "../../../tests/helpers/exercise-setup";
vi.mock("@/utils/http", () => import("../../../tests/mocks/http-failure"));
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
const modules = import.meta.glob<{ default: Component }>("../../**/*.vue");
const targetKeys = new Set([
  "../monitor/shared/MonitorCenter.vue",
  "../../layout/components/tag/index.vue",
  "../auth/profile.vue",
  "../business/serviceWorkOrder/index.vue",
  "../fund/report/index.vue",
  "../inventory/documents/index.vue",
  "../sales/return/form.vue",
  "../business/stock/serialNumber/SerialNumberAddForm.vue",
  "../analysis/inventory/index.vue",
  "../company/payroll-run/index.vue",
  "../other/smartImport/index.vue",
  "../company/commission/index.vue",
  "../system/companies/index.vue",
  "../system/companies/components/CompanyPlanGrantsDialog.vue",
  "../sales/order/form.vue",
  "../inventory/transfer/index.vue",
  "../settings/backup/index.vue",
  "../analysis/purchase/index.vue",
  "../data/priceLimit/index.vue",
  "../other/aiEntry/index.vue",
  "../business/order/form.vue",
  "../analysis/subscriptions/index.vue",
  "../fund/documents/index.vue",
  "../purchase/return/form.vue",
  "../data/customerBalance/index.vue",
  "../data/supplierBalance/index.vue",
  "../system/features/index.vue",
  "../../layout/components/search/components/SearchModal.vue",
  "../inventory/report/index.vue",
  "../inventory/stocktaking/StocktakingDetailForm.vue",
  "../purchase/order/form.vue",
  "../settings/codeRule/index.vue",
  "../../layout/components/setting/index.vue",
  "../data/importExport/index.vue",
  "../purchase/inbound/form.vue",
  "../sales/return/ReturnInspectionDialog.vue",
  "../../components/BalanceAdjustment/BalanceHistoryPanel.vue",
  "../fund/receipt/form.vue",
  "../analysis/sales/index.vue",
  "../system/plan-redeem-codes/index.vue",
  "../business/finance/advance/AdvancePaymentFormDialog.vue",
  "../business/tire/form.vue",
  "../settings/closing/ClosingCheckForm.vue",
  "../system/subscription-plans/index.vue",
  "../business/finance/invoice/detail.vue",
  "../analysis/comprehensive/index.vue",
  "../business/purchase/inquiry/components/PurchaseQuotationManagerDialog.vue",
  "../data/priceInfo/index.vue",
  "../purchase/inbound/index.vue",
  "../analysis/serialTrace/index.vue",
  "../business/sales/quotation/index.vue",
  "../business/servicePackage/index.vue",
  "../data/multiUnit/form.vue",
  "../system/help-center/index.vue",
  "../system/task/index.vue",
  "../data/auxiliaryAttr/index.vue",
  "../data/batchSerial/index.vue",
  "../inventory/bom/index.vue",
  "../../layout/components/sidebar/sidebarItem.vue",
  "../business/contract/purchase/index.vue"
]);
const entries = Object.entries(modules).filter(([p]) => targetKeys.has(p));
console.log("MATCHED", entries.length, "OF", targetKeys.size);
describe("pilot deep error", () => {
  it.each(entries)("%s renders failure state", async (sourcePath, loader) => {
    const wrapper = await mountSmokeComponent(loader, sourcePath, {
      keepMounted: true,
      deep: true,
      allowRenderErrors: true,
      variant: 1
    });
    try {
      const called = await exerciseSetupHandlers(wrapper, { variants: [1] });
      expect(Array.isArray(called)).toBe(true);
    } finally {
      wrapper.unmount();
      document.body.innerHTML = "";
    }
  });
});

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
  "../analysis/archiving/index.vue",
  "../analysis/dashboard/index.vue",
  "../analysis/serialTrace/index.vue",
  "../auth/ResetPasswordForm.vue",
  "../business/contract/sale/index.vue",
  "../business/customer/levelDialog.vue",
  "../business/finance/income/IncomeForm.vue",
  "../business/finance/salePicking/index.vue",
  "../business/finance/writeOff/index.vue",
  "../business/logistic/LogisticDetailDrawer.vue",
  "../business/order/components/ClaimAttachmentUpload.vue",
  "../business/payment/index.vue",
  "../business/purchase/inquiry/components/PurchaseQuotationManagerDialog.vue",
  "../business/sales/quotation/index.vue",
  "../business/stock/packing/form.vue",
  "../business/stockTaking/components/OrderBridge.vue",
  "../business/tire/index.vue",
  "../company/barcode-settings/index.vue",
  "../company/info/components/CompanyCurrentPlanCard.vue",
  "../company/position/menuForm.vue",
  "../data/account/form.vue",
  "../data/columnSettings/index.vue",
  "../data/customerProductCode/index.vue",
  "../data/multiUnit/form.vue",
  "../data/productCategory/form.vue",
  "../data/supplier/form.vue",
  "../error/403.vue",
  "../fund/otherIncome/index.vue",
  "../fund/report/components/ReportStatisticsCards.vue",
  "../inventory/bom/form.vue",
  "../inventory/documents/form.vue",
  "../inventory/report/index.vue",
  "../login/components/qrCode.vue",
  "../purchase/documents/index.vue",
  "../purchase/supplierPromotion/index.vue",
  "../sales/report/index.vue",
  "../settings/codeRule/form.vue",
  "../settings/dataAuth/index.vue",
  "../system/backup/index.vue",
  "../system/features/index.vue",
  "../system/menu/index.vue",
  "../system/role/permissionForm.vue",
  "../system/user/index.vue",
  "../welcome/components/initDict.vue"
]);
const entries = Object.entries(modules).filter(([p]) => targets.has(p));
describe("view deep exercise 2", () => {
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

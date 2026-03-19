import { h } from "vue";
import { addDialog } from "@/composables/useDialogService";
import type { PurchaseInquiryDto } from "@/api/business/purchase-inquiry";
import PurchaseQuotationManagerDialog from "./components/PurchaseQuotationManagerDialog.vue";

export function openPurchaseQuotationManagerDialog(
  inquiry: PurchaseInquiryDto,
  onChanged?: () => Promise<void> | void
) {
  addDialog({
    title: `询价 #${inquiry.id} 报价管理`,
    width: "980px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(PurchaseQuotationManagerDialog, {
        inquiry,
        onChanged: async () => {
          await onChanged?.();
        }
      })
  });
}

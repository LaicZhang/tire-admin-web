import { ref } from "vue";
import { getPrintTemplateApi, savePrintTemplateApi } from "@/api/tools";
import { message } from "@/utils/message";

type PrintType = "sale-order" | "purchase-order" | "logistic" | "stock-taking";

export function useIoPrint() {
  const printType = ref<PrintType>("sale-order");
  const printTemplate = ref("");
  const printLoading = ref(false);

  const printTypeOptions: Array<{ label: string; value: PrintType }> = [
    { label: "销售订单", value: "sale-order" },
    { label: "采购订单", value: "purchase-order" },
    { label: "物流单", value: "logistic" },
    { label: "库存盘点", value: "stock-taking" }
  ];

  async function loadPrintTemplate() {
    printLoading.value = true;
    try {
      const { data, code, msg } = await getPrintTemplateApi(printType.value);
      if (code === 200) {
        printTemplate.value = data?.template || "";
      } else {
        message(msg || "加载失败", { type: "error" });
      }
    } catch {
      message("加载模板失败", { type: "error" });
    } finally {
      printLoading.value = false;
    }
  }

  async function savePrintTemplate() {
    if (!printTemplate.value) {
      message("请输入模板内容", { type: "warning" });
      return;
    }
    printLoading.value = true;
    try {
      const { code, msg } = await savePrintTemplateApi({
        type: printType.value,
        template: printTemplate.value
      });
      if (code === 200) {
        message("保存成功", { type: "success" });
      } else {
        message(msg || "保存失败", { type: "error" });
      }
    } catch {
      message("保存失败", { type: "error" });
    } finally {
      printLoading.value = false;
    }
  }

  return {
    printType,
    printTemplate,
    printLoading,
    printTypeOptions,
    loadPrintTemplate,
    savePrintTemplate
  };
}

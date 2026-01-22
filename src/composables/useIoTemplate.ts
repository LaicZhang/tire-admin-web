import { ref } from "vue";
import { downloadImportTemplateApi } from "@/api/tools";
import { message } from "@/utils/message";
import { downloadBlob } from "@/utils/download";

type TemplateType = "user" | "tire" | "customer" | "provider";

export function useIoTemplate() {
  const templateType = ref<TemplateType>("user");
  const typeOptions: Array<{ label: string; value: TemplateType }> = [
    { label: "员工导入", value: "user" },
    { label: "商品导入", value: "tire" },
    { label: "客户导入", value: "customer" },
    { label: "供应商导入", value: "provider" }
  ];

  async function downloadTemplate() {
    try {
      const blob = await downloadImportTemplateApi(templateType.value);
      downloadBlob(blob, `template_${templateType.value}.xlsx`, {
        showMessage: true
      });
    } catch {
      message("下载失败", { type: "error" });
    }
  }

  return {
    templateType,
    typeOptions,
    downloadTemplate
  };
}

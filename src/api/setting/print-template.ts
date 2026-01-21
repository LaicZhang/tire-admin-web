import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const printPrefix = "/print-template/";

export async function getPrintTemplatesApi(docType?: string) {
  const url = docType
    ? baseUrlApi(printPrefix + "list?docType=" + docType)
    : baseUrlApi(printPrefix + "list");
  return await http.request<CommonResult>("get", url);
}

export async function setDefaultTemplateApi(uid: string) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(printPrefix + uid + "/default")
  );
}

export async function setDefaultPrintTemplateApi(uid: string) {
  return await setDefaultTemplateApi(uid);
}

export async function copyTemplateApi(uid: string, newName: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(printPrefix + "copy"),
    {
      data: { uid, name: newName }
    }
  );
}

export async function copyPrintTemplateApi(uid: string, newName: string) {
  return await copyTemplateApi(uid, newName);
}

export async function deleteTemplateApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(printPrefix + uid)
  );
}

export async function deletePrintTemplateApi(uid: string) {
  return await deleteTemplateApi(uid);
}

export async function exportPrintTemplatesApi(uids: string[]) {
  return await http.request<Blob>("post", baseUrlApi(printPrefix + "export"), {
    data: { uids },
    responseType: "blob"
  });
}

export async function importPrintTemplatesApi(formData: FormData) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(printPrefix + "import"),
    {
      data: formData
    }
  );
}

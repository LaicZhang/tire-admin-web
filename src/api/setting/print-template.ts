import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { unsupportedBackendRoute } from "../route-gap";

const printPrefix = "/print-template/";

export async function getPrintTemplatesApi(docType?: string) {
  const url = docType
    ? baseUrlApi(printPrefix + "list?docType=" + docType)
    : baseUrlApi(printPrefix + "list");
  return await http.request<CommonResult>("get", url);
}

/** 后端没有设置默认模板路由。列表接口仍是 C 类，本批不改。 */
export async function setDefaultTemplateApi(_uid: string) {
  return unsupportedBackendRoute("PATCH /print-template/:uid/default");
}

export async function setDefaultPrintTemplateApi(uid: string) {
  return await setDefaultTemplateApi(uid);
}

export async function copyTemplateApi(_uid: string, _newName: string) {
  return unsupportedBackendRoute("POST /print-template/copy");
}

export async function copyPrintTemplateApi(uid: string, newName: string) {
  return await copyTemplateApi(uid, newName);
}

export async function deleteTemplateApi(_uid: string) {
  return unsupportedBackendRoute("DELETE /print-template/:uid");
}

export async function deletePrintTemplateApi(uid: string) {
  return await deleteTemplateApi(uid);
}

export async function exportPrintTemplatesApi(_uids: string[]) {
  return unsupportedBackendRoute("POST /print-template/export");
}

export async function importPrintTemplatesApi(_formData: FormData) {
  return unsupportedBackendRoute("POST /print-template/import");
}

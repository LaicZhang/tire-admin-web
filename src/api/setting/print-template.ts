import { unsupportedBackendRoute } from "../route-gap";

/**
 * The backend exposes a single template read at `/tools/print/template/:type`,
 * not the legacy admin list endpoint. Keep this wrapper fail-closed until the
 * UI is migrated to the backend's single-template contract instead of sending
 * requests to a route that cannot exist.
 */
export async function getPrintTemplatesApi(_docType?: string) {
  return unsupportedBackendRoute("GET /print-template/list");
}

/** 后端没有设置默认模板路由。 */
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

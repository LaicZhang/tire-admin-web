import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/setting/";

export async function getSettingListApi(index: number) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index)
  );
}

export async function getSettingGroupApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "list"));
}

export async function addSettingApi(data: {
  key: string;
  value?: string;
  group?: string;
}) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getSettingApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateSettingApi(
  uid: string,
  data: {
    key?: string;
    value?: string;
    group?: string;
  }
) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteSettingApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

// Batch update settings by group
export async function batchUpdateSettingsApi(
  group: string,
  data: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "batch"),
    {
      data: { group, settings: data }
    }
  );
}

// Company info APIs
const companyPrefix = "/company/";

export async function getCompanyInfoApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(companyPrefix + "info")
  );
}

export async function updateCompanyInfoApi(data: Record<string, unknown>) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(companyPrefix + "info"),
    {
      data
    }
  );
}

export async function uploadCompanyLogoApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(companyPrefix + "logo"),
    { data: formData }
  );
}

// Print template APIs
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

// Advanced/legacy naming aliases (keep compatibility with pages)
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

// Free account import APIs
const freeAccountPrefix = "/free-account/";

export async function getFreeAccountsApi(params?: {
  accountName?: string;
  companyName?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(freeAccountPrefix + "list"),
    {
      params
    }
  );
}

export async function importFreeAccountApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(freeAccountPrefix + uid + "/import")
  );
}

export async function batchImportFreeAccountsApi(uids: string[]) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(freeAccountPrefix + "batch-import"),
    { data: { uids } }
  );
}

export async function verifyFreeAccountAuthApi(uid: string, code: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(freeAccountPrefix + uid + "/verify"),
    { data: { code } }
  );
}

// Recycle bin APIs
const recyclePrefix = "/recycle/";

export async function getRecycleListApi(
  page: number,
  params?: { type?: string; keyword?: string }
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(recyclePrefix + "page/" + page),
    { params }
  );
}

export async function restoreRecycleItemApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(recyclePrefix + uid + "/restore")
  );
}

export async function permanentDeleteApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(recyclePrefix + uid + "/permanent")
  );
}

export async function batchRestoreApi(uids: string[]) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(recyclePrefix + "batch-restore"),
    { data: { uids } }
  );
}

export async function batchPermanentDeleteApi(uids: string[]) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(recyclePrefix + "batch-permanent"),
    { data: { uids } }
  );
}

// 数据授权相关
export async function getDataAuthUsersApi(params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/data-auth/users"),
    { params }
  );
}

export async function getUserDataAuthApi(userId: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/data-auth/users/" + userId)
  );
}

export async function syncCustomerAuthApi(userId: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/data-auth/users/" + userId + "/sync-customers")
  );
}

export async function saveUserDataAuthApi(userId: string, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi("/data-auth/users/" + userId),
    { data }
  );
}

export async function exportDataAuthApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/data-auth/export")
  );
}

// 操作日志相关
export async function getOperationLogsApi(params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/operation-log/"),
    {
      params
    }
  );
}

// 备份相关
export async function getBackupListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi("/backup/"), {
    params
  });
}

export async function createBackupApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi("/backup/"), {
    data
  });
}

export async function restoreBackupApi(backupId: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/backup/" + backupId + "/restore")
  );
}

export async function downloadBackupApi(backupId: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/backup/" + backupId + "/download")
  );
}

export async function deleteBackupApi(backupId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi("/backup/" + backupId)
  );
}

export async function updateBackupSettingsApi(data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi("/backup/settings"),
    {
      data
    }
  );
}

// 权限相关
export async function getPermissionUsersApi(params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/permission/users"),
    {
      params
    }
  );
}

export async function getPermissionRolesApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/permission/roles")
  );
}

export async function savePermissionUserApi(data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/permission/users"),
    {
      data
    }
  );
}

export async function deletePermissionUserApi(userId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi("/permission/users/" + userId)
  );
}

export async function saveRolePermissionsApi(
  roleId: string,
  permissions: string[]
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi("/permission/roles/" + roleId),
    { data: { permissions } }
  );
}

export async function createRoleApi(data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/permission/roles"),
    {
      data
    }
  );
}

export async function deleteRoleApi(roleId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi("/permission/roles/" + roleId)
  );
}

// 结账相关
export async function getClosingRecordsApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi("/closing/"), {
    params
  });
}

export async function runClosingChecksApi(period: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/closing/check"),
    {
      data: { period }
    }
  );
}

export async function executeClosingApi(
  period: string,
  action: "close" | "unclose"
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/closing/execute"),
    {
      data: { period, action }
    }
  );
}

// Code rule APIs
const codeRulePrefix = "/code-rule/";

export async function getCodeRulesApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult>("get", baseUrlApi(codeRulePrefix), {
    params
  });
}

export async function saveCodeRuleApi(data: Record<string, unknown>) {
  return await http.request<CommonResult>("post", baseUrlApi(codeRulePrefix), {
    data
  });
}

export async function updateCodeRuleApi(
  ruleId: string,
  data: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(codeRulePrefix + ruleId),
    { data }
  );
}

export async function enableCodeRuleApi(ruleId: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(codeRulePrefix + ruleId + "/enable")
  );
}

export async function disableCodeRuleApi(ruleId: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(codeRulePrefix + ruleId + "/disable")
  );
}

export async function deleteCodeRuleApi(ruleId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(codeRulePrefix + ruleId)
  );
}

export async function batchDeleteCodeRulesApi(ruleIds: string[]) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(codeRulePrefix + "batch-delete"),
    { data: { ruleIds } }
  );
}

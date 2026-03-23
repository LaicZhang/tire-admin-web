import {
  getCompanySettingGroupApi,
  patchCompanySettingGroupApi
} from "@/api/setting";

export type ColumnSettings = unknown[];

const GROUP = "dataColumnSettings";

export async function getColumnSettingsApi(
  module: string
): Promise<ColumnSettings | null> {
  const res = await getCompanySettingGroupApi(GROUP);
  if (res.code !== 200) {
    throw new Error(res.msg || "获取列设置失败");
  }
  const raw = res.data?.find(item => item.key === module)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ColumnSettings;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveColumnSettingsApi(
  module: string,
  columns: ColumnSettings
): Promise<void> {
  const res = await patchCompanySettingGroupApi(GROUP, {
    [module]: columns
  });
  if (res.code !== 200) {
    throw new Error(res.msg || "保存列设置失败");
  }
}

export async function clearColumnSettingsApi(module: string): Promise<void> {
  const res = await patchCompanySettingGroupApi(GROUP, {
    [module]: ""
  });
  if (res.code !== 200) {
    throw new Error(res.msg || "清空列设置失败");
  }
}

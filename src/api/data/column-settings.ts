import {
  getCompanySettingGroupApi,
  patchCompanySettingGroupApi
} from "@/api/setting";
import {
  isBoolean,
  isFiniteNumber,
  isObject,
  isString,
  parseJsonOrNull
} from "@/utils/type-guards";

export interface ColumnSettingsItem {
  id: number;
  uid: string;
  module: string;
  field: string;
  label: string;
  alias?: string;
  visible: boolean;
  sortOrder: number;
  width?: number;
  fixed?: "left" | "right" | false;
}

export type ColumnSettings = ColumnSettingsItem[];

const GROUP = "dataColumnSettings";

function isColumnFixed(value: unknown): value is ColumnSettingsItem["fixed"] {
  return (
    value === undefined ||
    value === false ||
    value === "left" ||
    value === "right"
  );
}

function isColumnSettingsItem(value: unknown): value is ColumnSettingsItem {
  if (!isObject(value)) return false;

  return (
    isFiniteNumber(value.id) &&
    isString(value.uid) &&
    isString(value.module) &&
    isString(value.field) &&
    isString(value.label) &&
    isBoolean(value.visible) &&
    isFiniteNumber(value.sortOrder) &&
    (value.alias === undefined || isString(value.alias)) &&
    (value.width === undefined || isFiniteNumber(value.width)) &&
    isColumnFixed(value.fixed)
  );
}

function parseColumnSettings(raw: string): ColumnSettings | null {
  const parsed = parseJsonOrNull(raw);
  if (!Array.isArray(parsed)) return null;
  return parsed.every(isColumnSettingsItem) ? parsed : null;
}

export async function getColumnSettingsApi(
  module: string
): Promise<ColumnSettings | null> {
  const res = await getCompanySettingGroupApi(GROUP);
  if (res.code !== 200) {
    throw new Error(res.msg || "获取列设置失败");
  }
  const raw = res.data?.find(item => item.key === module)?.value;
  if (!raw) return null;
  return parseColumnSettings(raw);
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

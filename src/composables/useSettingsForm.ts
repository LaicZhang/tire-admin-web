import { onMounted, ref, type Ref } from "vue";
import { message } from "@/utils";
import {
  getCompanySettingGroupApi,
  patchCompanySettingGroupApi,
  type CompanySettingItem
} from "@/api/setting";
import type { CommonResult } from "@/api/type";
import { analyzeSettingsPresence } from "@/utils/settingsPresence";

function parseSettingValue(value: string): boolean | number | string {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

export interface UseSettingsFormOptions<T extends object> {
  /** Settings group name, e.g. "sys", "func", "cost" */
  group: string;
  /** Extra groups to load together. Defaults to [group]. */
  loadGroups?: readonly string[];
  /** Load settings by group. Defaults to company setting API. */
  loadGroup?: (group: string) => Promise<CommonResult<CompanySettingItem[]>>;
  /** Save settings by group. Defaults to company setting API. */
  saveGroup?: (
    group: string,
    settings: Record<string, unknown>
  ) => Promise<CommonResult>;
  /** Default form data */
  defaults: () => T;
  /** Expected setting keys (for missing/unset UI state). Defaults to keys of `defaults()` result. */
  expectedKeys?: readonly string[];
  /** Custom transform from CompanySettingItem[] to partial form data.
   *  If not provided, uses default mapping with auto boolean/number conversion. */
  transformLoad?: (settings: CompanySettingItem[], formData: T) => void;
  /** Custom transform before saving. By default saves formData as-is. */
  transformSave?: (formData: T) => Record<string, unknown>;
  /** Custom transform before saving to multiple groups. */
  transformSaveMulti?: (formData: T) => Record<string, Record<string, unknown>>;
  /** Whether to auto-load on mount. Defaults to true. */
  immediate?: boolean;
}

export interface UseSettingsFormOptionsWithLoadItem<
  T extends object,
  LoadItem = CompanySettingItem
> {
  /** Settings group name, e.g. "sys", "func", "cost" */
  group: string;
  /** Extra groups to load together. Defaults to [group]. */
  loadGroups?: readonly string[];
  /** Load settings by group. Defaults to company setting API. */
  loadGroup?: (group: string) => Promise<CommonResult<LoadItem[]>>;
  /** Save settings by group. Defaults to company setting API. */
  saveGroup?: (
    group: string,
    settings: Record<string, unknown>
  ) => Promise<CommonResult>;
  /** Default form data */
  defaults: () => T;
  /** Expected setting keys (for missing/unset UI state). Defaults to keys of `defaults()` result. */
  expectedKeys?: readonly string[];
  /** Custom transform from loaded items to partial form data. */
  transformLoad?: (settings: LoadItem[], formData: T) => void;
  /** Custom transform before saving. By default saves formData as-is. */
  transformSave?: (formData: T) => Record<string, unknown>;
  /** Custom transform before saving to multiple groups. */
  transformSaveMulti?: (formData: T) => Record<string, Record<string, unknown>>;
  /** Whether to auto-load on mount. Defaults to true. */
  immediate?: boolean;
}

export function useSettingsForm<
  T extends object,
  LoadItem = CompanySettingItem
>(options: UseSettingsFormOptionsWithLoadItem<T, LoadItem>) {
  const {
    group,
    loadGroups,
    loadGroup,
    saveGroup,
    defaults,
    expectedKeys,
    transformLoad,
    transformSave,
    transformSaveMulti,
    immediate = true
  } = options;

  const loadByGroup =
    loadGroup ??
    (getCompanySettingGroupApi as (
      group: string
    ) => Promise<CommonResult<LoadItem[]>>);
  const saveByGroup = saveGroup ?? patchCompanySettingGroupApi;

  const loading = ref(false);
  const formRef = ref();
  const initialDefaults = defaults();
  const formData = ref(initialDefaults) as Ref<T>;
  const expectedSettingKeys = Object.freeze(
    (expectedKeys?.length ? expectedKeys : Object.keys(initialDefaults)).map(
      k => String(k)
    )
  );
  const missingSettingKeys = ref<readonly string[]>([]);
  const unsetSettingKeys = ref<readonly string[]>([]);

  const loadSettings = async () => {
    loading.value = true;
    try {
      const groupsToLoad = loadGroups?.length ? loadGroups : [group];
      const results = await Promise.all(
        groupsToLoad.map(async g => ({
          group: g,
          ...(await loadByGroup(g))
        }))
      );

      const merged: LoadItem[] = [];
      for (const r of results) {
        if (r.code !== 200 || !r.data) {
          throw new Error(`加载设置失败（${r.group}）`);
        }
        merged.push(...r.data);
      }

      const presence = analyzeSettingsPresence({
        expectedKeys: expectedSettingKeys,
        items: merged as unknown as readonly Readonly<{
          key: string;
          value?: string | null;
        }>[]
      });
      missingSettingKeys.value = presence.missingKeys;
      unsetSettingKeys.value = presence.unsetKeys;

      if (merged.length > 0) {
        if (transformLoad) {
          transformLoad(merged, formData.value);
        } else {
          const groupSettings = merged as unknown as CompanySettingItem[];
          // Default mapping: auto-convert booleans and numbers
          groupSettings.forEach((s: CompanySettingItem) => {
            const key = s.key as keyof T;
            if (key in formData.value) {
              const val = s.value;
              (formData.value as Record<string, unknown>)[key as string] =
                parseSettingValue(val);
            }
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "加载设置失败";
      message(errorMessage, { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const handleSave = async () => {
    loading.value = true;
    try {
      if (transformSaveMulti) {
        const payload = transformSaveMulti(formData.value);
        for (const [groupName, settings] of Object.entries(payload)) {
          const { code, msg } = await saveByGroup(groupName, settings);
          if (code !== 200) {
            message(msg || `保存失败（${groupName}）`, { type: "error" });
            return;
          }
        }
        message("保存成功", { type: "success" });
        return;
      }

      const saveData = transformSave
        ? transformSave(formData.value)
        : formData.value;
      const { code, msg } = await saveByGroup(
        group,
        saveData as Record<string, unknown>
      );
      if (code === 200) {
        message("保存成功", { type: "success" });
      } else {
        message(msg || "保存失败", { type: "error" });
      }
    } catch {
      message("保存失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  if (immediate) {
    onMounted(() => {
      loadSettings();
    });
  }

  return {
    loading,
    formRef,
    formData,
    loadSettings,
    handleSave,
    missingSettingKeys,
    unsetSettingKeys
  };
}

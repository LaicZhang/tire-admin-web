import { onMounted, ref, type Ref } from "vue";
import { message } from "@/utils";
import {
  getCompanySettingGroupApi,
  patchCompanySettingGroupApi,
  type CompanySettingItem
} from "@/api/setting";
import type { CommonResult } from "@/api/type";

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

export function useSettingsForm<T extends object>(
  options: UseSettingsFormOptions<T>
) {
  const {
    group,
    loadGroups,
    loadGroup,
    saveGroup,
    defaults,
    transformLoad,
    transformSave,
    transformSaveMulti,
    immediate = true
  } = options;

  const loadByGroup = loadGroup ?? getCompanySettingGroupApi;
  const saveByGroup = saveGroup ?? patchCompanySettingGroupApi;

  const loading = ref(false);
  const formRef = ref();
  const formData = ref(defaults()) as Ref<T>;

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

      const merged: CompanySettingItem[] = [];
      for (const r of results) {
        if (r.code !== 200 || !r.data) {
          throw new Error(`加载设置失败（${r.group}）`);
        }
        merged.push(...r.data);
      }

      if (merged.length > 0) {
        const groupSettings = merged;
        if (transformLoad) {
          transformLoad(groupSettings, formData.value);
        } else {
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
    } catch {
      message("加载设置失败", { type: "error" });
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
    handleSave
  };
}

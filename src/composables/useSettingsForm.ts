import { onMounted, ref, type Ref } from "vue";
import { message } from "@/utils";
import {
  getSettingGroupApi,
  batchUpdateSettingsApi,
  type SettingItem
} from "@/api/setting";

export interface UseSettingsFormOptions<T extends object> {
  /** Settings group name, e.g. "sys", "func", "cost" */
  group: string;
  /** Default form data */
  defaults: () => T;
  /** Custom transform from SettingItem[] to partial form data.
   *  If not provided, uses default mapping with auto boolean/number conversion. */
  transformLoad?: (settings: SettingItem[], formData: T) => void;
  /** Custom transform before saving. By default saves formData as-is. */
  transformSave?: (formData: T) => Record<string, unknown>;
  /** Whether to auto-load on mount. Defaults to true. */
  immediate?: boolean;
}

export function useSettingsForm<T extends object>(
  options: UseSettingsFormOptions<T>
) {
  const {
    group,
    defaults,
    transformLoad,
    transformSave,
    immediate = true
  } = options;

  const loading = ref(false);
  const formRef = ref();
  const formData = ref(defaults()) as Ref<T>;

  const loadSettings = async () => {
    loading.value = true;
    try {
      const { code, data } = await getSettingGroupApi();
      if (code === 200 && data) {
        const groupSettings = data.filter(
          (s: SettingItem) => s.group === group
        );
        if (transformLoad) {
          transformLoad(groupSettings, formData.value);
        } else {
          // Default mapping: auto-convert booleans and numbers
          groupSettings.forEach((s: SettingItem) => {
            const key = s.key as keyof T;
            if (key in formData.value) {
              const val = s.value;
              (formData.value as Record<string, unknown>)[key as string] =
                val === "true"
                  ? true
                  : val === "false"
                    ? false
                    : Number(val) || val;
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
      const saveData = transformSave
        ? transformSave(formData.value)
        : formData.value;
      const { code } = await batchUpdateSettingsApi(
        group,
        saveData as Record<string, unknown>
      );
      if (code === 200) {
        message("保存成功", { type: "success" });
      } else {
        message("保存失败", { type: "error" });
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

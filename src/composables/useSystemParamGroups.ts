import { computed, onMounted, ref, type Ref } from "vue";
import { message, handleApiError } from "@/utils";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import {
  getSystemParamGroupApi,
  patchSystemParamGroupApi,
  type SystemParamItem,
  type SystemParamSource
} from "@/api/system/system-setting";

// Deliberately not reusing `useSettingsForm`: its form model is a fixed
// `defaults()` object, while system params are registry-driven (fields and
// types are only known after load). Keeping a separate composable also lets us
// save only changed keys, so untouched fields keep their env/default fallback.

export const SYSTEM_PARAM_SOURCE_LABELS: Record<SystemParamSource, string> = {
  db: "数据库",
  env: "环境变量",
  default: "默认值"
};

export function validateSystemParamValue(
  item: SystemParamItem,
  raw: string
): string | null {
  if (item.type === "number") {
    if (raw.trim() === "") return "请输入数值";
    const value = Number(raw);
    if (!Number.isFinite(value)) return "请输入有效数值";
    if (item.integer && !Number.isInteger(value)) return "请输入整数";
    if (item.min !== undefined && value < item.min)
      return `不能小于 ${item.min}`;
    if (item.max !== undefined && value > item.max)
      return `不能大于 ${item.max}`;
  }
  if (item.type === "enum" && item.enumValues?.length) {
    if (!item.enumValues.includes(raw)) return "请选择有效值";
  }
  if (item.type === "json" && raw.trim() !== "") {
    try {
      JSON.parse(raw);
    } catch {
      return "请输入合法 JSON";
    }
  }
  return null;
}

/**
 * Builds per-group payloads containing only changed keys.
 * Untouched fields must not be written so env/default fallbacks keep working.
 */
export function collectChangedSettings(
  items: readonly SystemParamItem[],
  values: Readonly<Record<string, string>>,
  initial: Readonly<Record<string, string>>
): Record<string, Record<string, string>> {
  const payload: Record<string, Record<string, string>> = {};
  for (const item of items) {
    const next = values[item.key] ?? "";
    if (next === (initial[item.key] ?? "")) continue;
    payload[item.group] ??= {};
    payload[item.group]![item.key] = next;
  }
  return payload;
}

export function useSystemParamGroups(
  groups: readonly string[],
  options: { immediate?: boolean } = {}
) {
  const loading = ref(false);
  const saving = ref(false);
  const items: Ref<SystemParamItem[]> = ref([]);
  const values = ref<Record<string, string>>({});
  const initialValues = ref<Record<string, string>>({});
  const error = ref<string | null>(null);
  const { confirm } = useConfirmDialog();

  const itemByKey = computed(
    () => new Map(items.value.map(item => [item.key, item]))
  );
  const hasChanges = computed(() =>
    items.value.some(
      item =>
        (values.value[item.key] ?? "") !== (initialValues.value[item.key] ?? "")
    )
  );

  function setValue(key: string, value: string) {
    values.value = { ...values.value, [key]: value };
  }

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const results = await Promise.all(
        groups.map(group => getSystemParamGroupApi(group))
      );
      const merged: SystemParamItem[] = [];
      for (const result of results) {
        if (result.code !== 200 || !result.data) {
          throw new Error(result.msg || "加载系统参数失败");
        }
        merged.push(...result.data);
      }
      const next: Record<string, string> = {};
      for (const item of merged) next[item.key] = item.value;
      items.value = merged;
      values.value = { ...next };
      initialValues.value = { ...next };
    } catch (loadError) {
      error.value =
        loadError instanceof Error ? loadError.message : "加载系统参数失败";
      handleApiError(loadError, "加载系统参数失败");
    } finally {
      loading.value = false;
    }
  }

  async function confirmDangerousChanges(
    payload: Record<string, Record<string, string>>
  ): Promise<boolean> {
    const sampling = payload.logging?.operationLogSamplingRate;
    if (sampling !== undefined && Number(sampling) === 0) {
      return await confirm(
        "操作日志采样率为 0 后将停止写入操作日志，是否继续？",
        "确认停用操作日志"
      );
    }
    if (payload.env?.PAYLOAD_SANITIZE_MODE !== undefined) {
      return await confirm(
        "修改请求体净化模式会立即影响所有请求，是否继续？",
        "确认修改净化模式"
      );
    }
    return true;
  }

  async function save(): Promise<boolean> {
    const validationErrors: string[] = [];
    for (const [key, value] of Object.entries(values.value)) {
      const item = itemByKey.value.get(key);
      if (!item) continue;
      if ((initialValues.value[key] ?? "") === value) continue;
      const invalidReason = validateSystemParamValue(item, value);
      if (invalidReason)
        validationErrors.push(`${item.displayName}：${invalidReason}`);
    }
    if (validationErrors.length > 0) {
      message(validationErrors[0]!, { type: "error" });
      return false;
    }

    const payload = collectChangedSettings(
      items.value,
      values.value,
      initialValues.value
    );
    if (Object.keys(payload).length === 0) {
      message("没有需要保存的修改", { type: "info" });
      return true;
    }

    saving.value = true;
    try {
      if (!(await confirmDangerousChanges(payload))) return false;

      for (const [group, settings] of Object.entries(payload)) {
        const result = await patchSystemParamGroupApi(group, settings);
        if (result.code !== 200) {
          message(result.msg || `保存失败（${group}）`, { type: "error" });
          return false;
        }
      }
      message("保存成功", { type: "success" });
      await load();
      return true;
    } catch (saveError) {
      handleApiError(saveError, "保存系统参数失败");
      return false;
    } finally {
      saving.value = false;
    }
  }

  if (options.immediate !== false) {
    onMounted(() => {
      void load();
    });
  }

  return {
    loading,
    saving,
    items,
    values,
    initialValues,
    error,
    hasChanges,
    load,
    save,
    setValue,
    sourceLabel: (source: SystemParamSource) =>
      SYSTEM_PARAM_SOURCE_LABELS[source]
  };
}

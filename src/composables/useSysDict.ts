import { computed, onMounted, ref } from "vue";
import { localForage, SYS } from "@/utils";

export type SysDictItem = {
  name?: string;
  key?: number;
  cn?: string | null;
  en?: string | null;
  [key: string]: unknown;
};

export type SysDictOption = {
  label: string;
  value: string;
  key?: number;
  raw: SysDictItem;
};

async function readSysDictRecord(): Promise<Record<string, SysDictItem[]>> {
  const cached = await localForage().getItem<Record<string, SysDictItem[]>>(
    SYS.dict
  );
  return cached && typeof cached === "object" ? cached : {};
}

function toOption(item: SysDictItem): SysDictOption | null {
  const label =
    (typeof item.cn === "string" && item.cn.trim()) ||
    (typeof item.en === "string" && item.en.trim()) ||
    (typeof item.key === "number" ? String(item.key) : "");
  if (!label) return null;
  return {
    label,
    value: label,
    key: typeof item.key === "number" ? item.key : undefined,
    raw: item
  };
}

/**
 * 从 SYS.dict（localForage 缓存）读取指定字典的下拉选项。
 * - 空字典时返回空数组；配合 el-select `allow-create` 可继续输入新值。
 * - value 默认使用 cn/en（回退 key 的字符串），适配常见 string 字段表单。
 */
export function useSysDictOptions(dictName: string) {
  const dictItems = ref<SysDictItem[]>([]);
  const isLoading = ref(false);

  const refresh = async () => {
    isLoading.value = true;
    try {
      const record = await readSysDictRecord();
      const items = record[dictName];
      dictItems.value = Array.isArray(items) ? items : [];
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    refresh();
  });

  const options = computed<SysDictOption[]>(() => {
    const seen = new Set<string>();
    const result: SysDictOption[] = [];
    for (const item of dictItems.value) {
      const opt = toOption(item);
      if (!opt) continue;
      if (seen.has(opt.value)) continue;
      seen.add(opt.value);
      result.push(opt);
    }
    return result;
  });

  return { options, isLoading, refresh };
}

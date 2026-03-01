<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { getRepoBatchApi, getRepoListApi, type Repo } from "@/api/company/repo";
import { handleApiError, message } from "@/utils";

type OptionItem = {
  value: string;
  label: string;
  raw?: Repo;
};

const props = withDefaults(
  defineProps<{
    /** 空字符串表示“全部” */
    modelValue?: string | null;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
  }>(),
  {
    placeholder: "请选择仓库",
    clearable: true,
    disabled: false
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const innerValue = computed<string>({
  get: () => (props.modelValue ? String(props.modelValue) : ""),
  set: val => emit("update:modelValue", val || "")
});

const loading = ref(false);
const options = ref<OptionItem[]>([]);

let requestSeq = 0;

async function fetchList(keyword: string) {
  const seq = ++requestSeq;
  loading.value = true;
  try {
    const res = await getRepoListApi(1, { keyword: keyword || "", limit: 50 });
    if (seq !== requestSeq) return;
    if (res.code !== 200) {
      message(res.msg || "加载仓库列表失败", { type: "error" });
      options.value = [];
      return;
    }
    const list = res.data?.list ?? [];
    options.value = list.map(r => ({ value: r.uid, label: r.name, raw: r }));
  } catch (error) {
    if (seq !== requestSeq) return;
    handleApiError(error, "加载仓库列表失败");
    options.value = [];
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

const fetchListDebounced = useDebounceFn(fetchList, 300);

async function ensureSelected(uid: string) {
  if (!uid) return;
  if (options.value.some(o => o.value === uid)) return;
  try {
    const res = await getRepoBatchApi([uid]);
    if (res.code !== 200) return;
    const found = (res.data ?? []).find(r => r.uid === uid);
    if (!found) return;
    options.value = [
      { value: found.uid, label: found.name, raw: found },
      ...options.value
    ];
  } catch {
    // silent
  }
}

watch(
  () => props.modelValue,
  val => {
    if (val) ensureSelected(String(val));
  },
  { immediate: true }
);

function onFocus() {
  if (options.value.length === 0) fetchList("");
}
</script>

<template>
  <el-select
    v-model="innerValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    filterable
    remote
    :remote-method="fetchListDebounced"
    :loading="loading"
    class="w-full"
    @focus="onFocus"
  >
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</template>

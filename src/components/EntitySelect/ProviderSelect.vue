<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import {
  getProviderBatchApi,
  getProviderListApi,
  type Provider
} from "@/api/business/provider";
import { handleApiError, message } from "@/utils";

type OptionItem = {
  value: string;
  label: string;
  raw?: Provider;
};

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
  }>(),
  {
    placeholder: "请选择供应商",
    clearable: true,
    disabled: false
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string | undefined];
}>();

const innerValue = computed<string | undefined>({
  get: () => (props.modelValue ? String(props.modelValue) : undefined),
  set: val => emit("update:modelValue", val || undefined)
});

const loading = ref(false);
const options = ref<OptionItem[]>([]);

let requestSeq = 0;

async function fetchList(keyword: string) {
  const seq = ++requestSeq;
  loading.value = true;
  try {
    const res = await getProviderListApi(1, { keyword: keyword || "" });
    if (seq !== requestSeq) return;
    if (res.code !== 200) {
      message(res.msg || "加载供应商列表失败", { type: "error" });
      options.value = [];
      return;
    }
    const list = res.data?.list ?? [];
    options.value = list.map(p => ({ value: p.uid, label: p.name, raw: p }));
  } catch (error) {
    if (seq !== requestSeq) return;
    handleApiError(error, "加载供应商列表失败");
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
    const res = await getProviderBatchApi([uid]);
    if (res.code !== 200) return;
    const found = (res.data ?? []).find(p => p.uid === uid);
    if (!found) return;
    options.value = [
      { value: found.uid, label: found.name, raw: found },
      ...options.value
    ];
  } catch {}
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

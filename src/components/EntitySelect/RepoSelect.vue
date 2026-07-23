<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { getRepoBatchApi, getRepoListApi, type Repo } from "@/api/company/repo";
import {
  listRecentEntities,
  touchRecentEntity
} from "@/composables/recentFormMemory";
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
const recent = ref<OptionItem[]>([]);
const keyword = ref("");

let requestSeq = 0;

async function loadRecent() {
  try {
    const items = await listRecentEntities("repo");
    recent.value = items.map(i => ({ value: i.uid, label: i.name }));
  } catch {
    recent.value = [];
  }
}

async function fetchList(kw: string) {
  const seq = ++requestSeq;
  loading.value = true;
  keyword.value = kw || "";
  try {
    const res = await getRepoListApi(1, {
      keyword: keyword.value,
      limit: 50
    });
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
  if (
    options.value.some(o => o.value === uid) ||
    recent.value.some(o => o.value === uid)
  ) {
    return;
  }
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
  void loadRecent();
  if (options.value.length === 0) fetchList("");
}

function onChange(val: string) {
  if (!val) return;
  const item =
    recent.value.find(o => o.value === val) ||
    options.value.find(o => o.value === val);
  void touchRecentEntity("repo", {
    uid: val,
    name: item?.label || val
  });
}

const showRecentGroup = computed(
  () => recent.value.length > 0 && keyword.value.trim().length === 0
);

const remoteOptions = computed(() => {
  if (!showRecentGroup.value) return options.value;
  const recentIds = new Set(recent.value.map(r => r.value));
  return options.value.filter(o => !recentIds.has(o.value));
});
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
    @change="onChange"
  >
    <template v-if="showRecentGroup">
      <el-option-group label="最近">
        <el-option
          v-for="item in recent"
          :key="`r-${item.value}`"
          :label="item.label"
          :value="item.value"
        />
      </el-option-group>
      <el-option-group v-if="remoteOptions.length" label="全部">
        <el-option
          v-for="item in remoteOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-option-group>
    </template>
    <template v-else>
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </template>
  </el-select>
</template>

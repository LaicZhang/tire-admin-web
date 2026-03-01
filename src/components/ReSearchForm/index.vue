<script setup lang="ts">
import { ref, computed } from "vue";
import { useDebounceFn } from "@vueuse/core";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import type { FormInstance } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { SearchFormProps, SearchFormEmits } from "./types";

defineOptions({
  name: "ReSearchForm"
});

const formRef = ref<FormInstance>();

const props = withDefaults(defineProps<SearchFormProps>(), {
  shadow: "never",
  loading: false,
  form: () => ({}),
  rules: () => ({}),
  bodyStyle: () => ({ paddingBottom: "0" }),
  debounceMs: 0
});

const emit = defineEmits<SearchFormEmits>();

defineExpose({
  resetFields: () => formRef.value?.resetFields(),
  validate: (callback?: (valid: boolean) => void) =>
    formRef.value?.validate(callback) ?? Promise.resolve(true),
  clearValidate: (props?: string | string[]) =>
    formRef.value?.clearValidate(props)
});

// 原始搜索函数
const doSearch = () => {
  emit("search");
};

// 根据 debounceMs 决定是否使用防抖
const debouncedSearch = computed(() => {
  if (props.debounceMs > 0) {
    return useDebounceFn(doSearch, props.debounceMs);
  }
  return doSearch;
});

const hasRules = computed(() => Object.keys(props.rules || {}).length > 0);

const handleSearch = async () => {
  if (formRef.value && hasRules.value) {
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;
  }
  debouncedSearch.value();
};

const handleReset = () => {
  emit("reset");
};
</script>

<template>
  <el-card
    :shadow="props.shadow"
    :body-style="props.bodyStyle"
    class="re-search-form mb-4"
  >
    <el-form
      ref="formRef"
      :inline="true"
      :model="props.form"
      :rules="props.rules"
      class="search-form-inline"
      @submit.prevent
    >
      <slot />
      <el-form-item>
        <slot name="actions">
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            :loading="props.loading"
            @click="handleSearch"
          >
            搜索
          </el-button>
          <el-button :icon="useRenderIcon(Refresh)" @click="handleReset">
            重置
          </el-button>
          <slot name="extraActions" />
        </slot>
      </el-form-item>
    </el-form>
  </el-card>
</template>

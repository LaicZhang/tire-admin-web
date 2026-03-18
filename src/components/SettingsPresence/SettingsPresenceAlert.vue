<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  missingKeys?: readonly string[];
  unsetKeys?: readonly string[];
  /** 用于定位表单项的 data attribute；默认 data-setting-key */
  dataKeyAttr?: string;
}>();

const dataKeyAttr = computed(() => props.dataKeyAttr ?? "data-setting-key");

const summary = computed(() => {
  const missing = props.missingKeys?.length ?? 0;
  const unset = props.unsetKeys?.length ?? 0;
  const total = missing + unset;
  if (total <= 0) return null;

  const firstKey = (props.missingKeys?.[0] ?? props.unsetKeys?.[0]) || null;

  return {
    total,
    missing,
    unset,
    firstKey,
    type: missing > 0 ? ("error" as const) : ("warning" as const),
    title:
      missing > 0 ? "存在配置缺失（未生成记录）" : "存在配置未设置（值为空）"
  };
});

function toCssSelectorValue(raw: string): string {
  const v = String(raw ?? "");
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(v);
  }
  return v.replaceAll('"', '\\"');
}

function scrollToFirst(): void {
  if (!summary.value?.firstKey) return;
  const attr = dataKeyAttr.value;
  const key = summary.value.firstKey;
  const selector = `[${attr}="${toCssSelectorValue(key)}"]`;
  const el = document.querySelector(selector);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}
</script>

<template>
  <el-alert v-if="summary" :type="summary.type" :closable="false" class="mb-4">
    <template #title>
      <div class="flex items-center gap-2">
        <span>{{ summary.title }}</span>
        <el-button link type="primary" @click="scrollToFirst">
          定位未设置项
        </el-button>
      </div>
    </template>

    <div class="text-sm leading-6">
      <div>
        共 <span class="font-medium">{{ summary.total }}</span> 项需要处理
        <template v-if="summary.missing > 0">
          （缺失 {{ summary.missing }}）
        </template>
        <template v-if="summary.unset > 0"
          >（未设置 {{ summary.unset }}）</template
        >
      </div>
      <div class="text-gray-600">
        请在本页补全并点击“保存设置”。如提示“缺失”，通常表示历史公司未执行补齐流程。
      </div>
    </div>
  </el-alert>
</template>

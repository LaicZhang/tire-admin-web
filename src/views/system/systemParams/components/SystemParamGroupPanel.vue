<script setup lang="ts">
import { computed } from "vue";
import type { SystemParamItem } from "@/api/system/system-setting";
import { useSystemParamGroups } from "@/composables/useSystemParamGroups";
import SystemParamRow from "./SystemParamRow.vue";

defineOptions({
  name: "SystemParamGroupPanel"
});

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    groups: readonly string[];
    sections: readonly { title: string; keys: readonly string[] }[];
  }>(),
  {
    title: "系统参数",
    description: "",
    groups: () => [],
    sections: () => []
  }
);

const {
  loading,
  saving,
  items,
  values,
  error,
  hasChanges,
  load,
  save,
  setValue
} = useSystemParamGroups(props.groups);

const itemByKey = computed(
  () => new Map(items.value.map(item => [item.key, item]))
);

const visibleSections = computed(() => {
  const used = new Set<string>();
  const sections = (Array.isArray(props.sections) ? props.sections : [])
    .map(section => {
      const keys: readonly string[] = Array.isArray(section?.keys)
        ? section.keys
        : [];
      const sectionItems = keys
        .map((key: string) => itemByKey.value.get(key))
        .filter((item: SystemParamItem | undefined): item is SystemParamItem =>
          Boolean(item)
        );
      for (const item of sectionItems) used.add(item.key);
      return { title: String(section?.title ?? ""), items: sectionItems };
    })
    .filter(section => section.items.length > 0);

  const rest = items.value.filter(item => !used.has(item.key));
  if (rest.length > 0) sections.push({ title: "其他", items: rest });
  return sections;
});
</script>

<template>
  <div v-loading="loading">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h4 class="text-base font-medium">{{ title }}</h4>
        <p v-if="description" class="text-sm text-gray-500 mt-1">
          {{ description }}
        </p>
      </div>
      <el-button
        type="primary"
        :loading="saving"
        :disabled="loading || !hasChanges"
        @click="save"
      >
        保存设置
      </el-button>
    </div>

    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      class="mb-4"
    >
      <el-button link type="primary" @click="load">重试</el-button>
    </el-alert>

    <el-empty
      v-if="!loading && items.length === 0"
      description="暂无系统参数"
    />

    <el-form v-else :model="values" label-width="240px" label-position="left">
      <template v-for="section in visibleSections" :key="section.title">
        <el-divider content-position="left">{{ section.title }}</el-divider>
        <SystemParamRow
          v-for="item in section.items"
          :key="item.key"
          :item="item"
          :model-value="values[item.key] ?? ''"
          @update:model-value="value => setValue(item.key, value)"
        />
      </template>
    </el-form>
  </div>
</template>

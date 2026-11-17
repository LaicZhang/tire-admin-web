<script setup lang="ts">
import { computed } from "vue";
import type {
  SystemParamItem,
  SystemParamSource
} from "@/api/system/system-setting";

defineOptions({
  name: "SystemParamRow"
});

const props = defineProps<{
  item: SystemParamItem;
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const SOURCE_LABELS: Record<SystemParamSource, string> = {
  db: "数据库",
  env: "环境变量",
  default: "默认值"
};

const SOURCE_TAG_TYPES: Record<
  SystemParamSource,
  "success" | "warning" | "info"
> = {
  db: "success",
  env: "warning",
  default: "info"
};

const numberValue = computed(() => {
  if (props.modelValue === "") return undefined;
  const value = Number(props.modelValue);
  return Number.isFinite(value) ? value : undefined;
});

const booleanValue = computed(() => props.modelValue === "true");

function updateNumber(value: number | undefined) {
  emit("update:modelValue", value === undefined ? "" : String(value));
}

function updateBoolean(value: string | number | boolean) {
  emit("update:modelValue", value === true ? "true" : "false");
}

function updateText(value: string) {
  emit("update:modelValue", value ?? "");
}
</script>

<template>
  <el-form-item :label="item.displayName" :data-setting-key="item.key">
    <div class="w-full max-w-2xl">
      <div class="flex items-center gap-3">
        <el-switch
          v-if="item.type === 'boolean'"
          :model-value="booleanValue"
          @update:model-value="updateBoolean"
        />
        <el-input-number
          v-else-if="item.type === 'number'"
          :model-value="numberValue"
          :min="item.min"
          :max="item.max"
          :step="item.integer === true ? 1 : 0.01"
          :precision="item.integer === true ? 0 : undefined"
          controls-position="right"
          class="w-56"
          @update:model-value="updateNumber"
        />
        <el-select
          v-else-if="item.type === 'enum'"
          :model-value="modelValue"
          class="w-56"
          @update:model-value="updateText"
        >
          <el-option
            v-for="option in item.enumValues ?? []"
            :key="option"
            :label="option"
            :value="option"
          />
        </el-select>
        <el-input
          v-else
          :model-value="modelValue"
          :type="item.multiline ? 'textarea' : 'text'"
          :rows="item.multiline ? 3 : undefined"
          :placeholder="item.defaultValue || '请输入'"
          class="w-full"
          @update:model-value="updateText"
        />
        <el-tag
          size="small"
          effect="plain"
          :type="SOURCE_TAG_TYPES[item.source]"
        >
          {{ SOURCE_LABELS[item.source] }}
        </el-tag>
      </div>
      <div class="mt-1 text-xs text-gray-500 leading-5">
        <span>默认值：{{ item.defaultValue || "空" }}</span>
        <span v-if="item.source === 'env'" class="ml-3 text-amber-600">
          当前生效值来自环境变量；保存后写入数据库
        </span>
        <span v-if="item.description" class="ml-3">{{ item.description }}</span>
      </div>
    </div>
  </el-form-item>
</template>

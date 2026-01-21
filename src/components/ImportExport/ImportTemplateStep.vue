<script setup lang="ts">
import { h } from "vue";
import { ElTag } from "element-plus";
import type { TemplateField } from "./types";

interface Props {
  loading: boolean;
  templateFields: TemplateField[];
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "download"): void;
}>();

const templateColumns: TableColumnList = [
  {
    label: "字段名",
    prop: "label",
    width: 120
  },
  {
    label: "列名",
    prop: "name",
    width: 120
  },
  {
    label: "必填",
    prop: "required",
    width: 80,
    cellRenderer: ({ row }) => {
      return row.required
        ? h(ElTag, { type: "danger", size: "small" }, () => "是")
        : h(ElTag, { type: "info", size: "small" }, () => "否");
    }
  },
  {
    label: "类型",
    prop: "type"
  }
];
</script>

<template>
  <div class="step mb-6">
    <h4 class="text-sm font-medium mb-2">第一步：下载导入模板</h4>
    <el-button :loading="loading" @click="emit('download')">
      下载模板
    </el-button>
    <p class="text-xs text-gray-400 mt-2">
      请按模板格式填写数据，支持 .xlsx 和 .xls 格式
    </p>
  </div>

  <div v-if="templateFields.length > 0" class="mb-6">
    <el-collapse>
      <el-collapse-item title="查看字段说明">
        <pure-table
          :data="templateFields"
          :columns="templateColumns"
          size="small"
          border
        />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

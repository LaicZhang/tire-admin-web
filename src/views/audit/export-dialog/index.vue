<script setup lang="ts">
import { ref } from "vue";
import ExportDialog from "@/components/ImportExport/ExportDialog.vue";

defineOptions({
  name: "AuditExportDialog"
});

const visible = ref(false);
const selectedIds = ["c1", "c2"];
const filters = {
  keyword: "审计关键字",
  scope: "nonDeleted",
  status: "active"
};
</script>

<template>
  <div class="main p-4">
    <el-card>
      <template #header>审计导出弹窗页</template>
      <div class="mb-4 text-sm text-gray-500">
        本页固定注入选中 ID 与筛选条件，用于验证导出弹窗对后端参数透传。
      </div>
      <el-descriptions :column="1" border class="mb-4">
        <el-descriptions-item label="选中 ID">
          {{ selectedIds.join(", ") }}
        </el-descriptions-item>
        <el-descriptions-item label="筛选条件">
          {{ JSON.stringify(filters) }}
        </el-descriptions-item>
      </el-descriptions>
      <el-button
        type="primary"
        data-testid="open-export-dialog"
        @click="visible = true"
      >
        打开审计导出弹窗
      </el-button>
    </el-card>

    <ExportDialog
      v-model:visible="visible"
      type="customer"
      title="审计导出弹窗"
      :filters="filters"
      :selected-ids="selectedIds"
    />
  </div>
</template>

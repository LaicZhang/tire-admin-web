<script setup lang="ts">
import { computed, h, ref, watch } from "vue";
import { ElMessageBox, type FormInstance } from "element-plus";
import { detailColumns } from "./columns";
import { addDialog } from "@/composables/useDialogService";
import type { StocktakingDetail, StocktakingTask } from "./types";
import {
  exportInventoryCheckResultApi,
  exportInventoryCheckSystemStockApi,
  getInventoryCheckTaskApi,
  importInventoryCheckDetailsApi,
  saveInventoryCheckTaskApi,
  updateInventoryCheckDetailsApi
} from "@/api/business/inventory-check";
import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";
import { handleApiError, message } from "@/utils";
import {
  formatSerialNoListText,
  parseSerialNoListText
} from "@/utils/serialNumber";
import StocktakingDetailEditor from "./StocktakingDetailEditor.vue";

interface Props {
  formInline: {
    task: StocktakingTask | null;
  };
}

const props = defineProps<Props>();

const detailList = ref<StocktakingDetail[]>([]);
const detailLoading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const detailEditorRef = ref<{
  formRef?: FormInstance;
  getPayload: () => {
    detailId: number;
    actualCount: number;
    actualSerialNos?: string[];
    reasonCode?: string;
    remark?: string;
  };
} | null>(null);

// 计算列：在进行中状态显示操作列，否则隐藏
const displayColumns = computed(() => {
  const task = props.formInline.task;
  const columns = detailColumns.filter(col =>
    task?.mode === "serial"
      ? true
      : !["bookSerialNos", "actualSerialNos"].includes(String(col.prop))
  );
  if (task?.status === "IN_PROGRESS") {
    return columns;
  }
  return columns.filter(col => col.slot !== "operation");
});

const loadDetails = async () => {
  if (!props.formInline.task) return;

  detailLoading.value = true;
  try {
    const { data, code } = await getInventoryCheckTaskApi(
      props.formInline.task.id
    );
    if (code === 200) {
      detailList.value = (data.details || []) as StocktakingDetail[];
    }
  } catch (error) {
    handleApiError(error, "获取盘点明细失败");
  } finally {
    detailLoading.value = false;
  }
};

const handleUpdateDetail = async (detail: StocktakingDetail) => {
  if (!props.formInline.task) return;

  addDialog({
    title: "更新盘点明细",
    width: "640px",
    closeOnClickModal: false,
    props: {
      detail,
      mode: props.formInline.task.mode
    },
    contentRenderer: ({ options }) =>
      h(StocktakingDetailEditor, {
        ref: detailEditorRef,
        detail: (options.props as { detail: StocktakingDetail }).detail,
        mode: (options.props as { mode?: "quantity" | "serial" }).mode
      }),
    beforeSure: async done => {
      const editor = detailEditorRef.value;
      const form = editor?.formRef;
      if (!editor || !form) return;
      const valid = await form.validate().catch(() => false);
      if (!valid) return;
      try {
        await updateInventoryCheckDetailsApi(props.formInline.task!.id, {
          details: [editor.getPayload()]
        });
        message("更新成功", { type: "success" });
        done();
        await loadDetails();
      } catch (error) {
        handleApiError(error, "更新失败");
      }
    }
  });
};

const handleSave = async () => {
  if (!props.formInline.task) return;
  try {
    await saveInventoryCheckTaskApi(props.formInline.task.id);
    message("盘点结果已保存", { type: "success" });
    loadDetails();
  } catch (error) {
    handleApiError(error, "保存盘点结果失败");
  }
};

const handleExportSystemStock = async () => {
  if (!props.formInline.task) return;
  try {
    const blob = await exportInventoryCheckSystemStockApi(
      props.formInline.task.id
    );
    downloadBlob(
      blob,
      generateFilenameWithTimestamp(
        `inventory-check-system-${props.formInline.task.id}`,
        "xlsx"
      ),
      { showMessage: true }
    );
  } catch (error) {
    handleApiError(error, "导出系统库存失败");
  }
};

const handleExportResult = async () => {
  if (!props.formInline.task) return;
  try {
    const blob = await exportInventoryCheckResultApi(props.formInline.task.id);
    downloadBlob(
      blob,
      generateFilenameWithTimestamp(
        `inventory-check-result-${props.formInline.task.id}`,
        "xlsx"
      ),
      { showMessage: true }
    );
  } catch (error) {
    handleApiError(error, "导出盘点结果失败");
  }
};

const resolveImportMode = async (): Promise<"replace" | "accumulate"> => {
  try {
    await ElMessageBox.confirm(
      "确定以覆盖模式导入？点击“累加导入”会在现有盘点数基础上累加。",
      "选择导入模式",
      {
        confirmButtonText: "覆盖导入",
        cancelButtonText: "累加导入",
        distinguishCancelAndClose: true,
        type: "warning"
      }
    );
    return "replace";
  } catch (error) {
    if (error === "cancel") {
      return "accumulate";
    }
    throw error;
  }
};

const handleImportClick = async () => {
  if (!props.formInline.task) return;
  try {
    const mode = await resolveImportMode();
    fileInputRef.value?.click();
    fileInputRef.value?.setAttribute("data-mode", mode);
  } catch (error) {
    if (error !== "close" && error !== "cancel") {
      handleApiError(error, "选择导入模式失败");
    }
  }
};

const handleFileChange = async (event: Event) => {
  if (!props.formInline.task) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const mode =
    (input.getAttribute("data-mode") as "replace" | "accumulate") || "replace";
  try {
    await importInventoryCheckDetailsApi(props.formInline.task.id, file, mode);
    message(mode === "replace" ? "覆盖导入成功" : "累加导入成功", {
      type: "success"
    });
    await loadDetails();
  } catch (error) {
    handleApiError(error, "导入盘点库存失败");
  } finally {
    input.value = "";
    input.removeAttribute("data-mode");
  }
};

// 初始加载
watch(
  () => props.formInline.task,
  task => {
    if (task) {
      loadDetails();
    }
  },
  { immediate: true }
);

defineExpose({
  loadDetails
});
</script>

<template>
  <div class="detail-wrapper">
    <div class="toolbar">
      <el-button
        v-if="props.formInline.task?.status === 'IN_PROGRESS'"
        type="primary"
        @click="handleSave"
      >
        保存盘点结果
      </el-button>
      <el-button
        v-if="props.formInline.task?.status === 'IN_PROGRESS'"
        @click="handleImportClick"
      >
        导入盘点库存
      </el-button>
      <el-button @click="handleExportSystemStock">导出系统库存</el-button>
      <el-button @click="handleExportResult">导出盘点结果</el-button>
      <input
        ref="fileInputRef"
        type="file"
        accept=".xlsx,.xls"
        class="hidden-input"
        @change="handleFileChange"
      />
    </div>

    <pure-table
      border
      :loading="detailLoading"
      :data="detailList"
      :columns="displayColumns"
      max-height="500"
    >
      <template #actualCount="{ row }">
        <span v-if="row.actualCount !== undefined">{{ row.actualCount }}</span>
        <span v-else class="text-gray-400">未录入</span>
      </template>
      <template #bookSerialNos="{ row }">
        <span v-if="row.bookSerialNos?.length">
          {{ formatSerialNoListText(row.bookSerialNos) }}
        </span>
        <span v-else>-</span>
      </template>
      <template #actualSerialNos="{ row }">
        <span v-if="row.actualSerialNos?.length">
          {{ formatSerialNoListText(row.actualSerialNos) }}
        </span>
        <span v-else class="text-gray-400">未录入</span>
      </template>
      <template #difference="{ row }">
        <span
          v-if="row.difference !== undefined"
          :class="
            row.difference > 0
              ? 'text-green-600'
              : row.difference < 0
                ? 'text-red-600'
                : ''
          "
        >
          {{ row.difference > 0 ? "+" : "" }}{{ row.difference }}
        </span>
        <span v-else>-</span>
      </template>
      <template #operation="{ row }">
        <el-button link type="primary" @click="handleUpdateDetail(row)">
          录入
        </el-button>
      </template>
    </pure-table>
  </div>
</template>

<style scoped>
.detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hidden-input {
  display: none;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-green-600 {
  color: #16a34a;
}

.text-red-600 {
  color: #dc2626;
}
</style>

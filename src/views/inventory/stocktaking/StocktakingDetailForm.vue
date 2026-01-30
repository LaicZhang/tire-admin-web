<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { detailColumns } from "./columns";
import { type StocktakingTask, type StocktakingDetail } from "./types";
import {
  getInventoryCheckTaskApi,
  updateInventoryCheckDetailsApi
} from "@/api/business/inventory-check";
import { ElMessageBox } from "element-plus";
import { handleApiError } from "@/utils";

interface Props {
  formInline: {
    task: StocktakingTask | null;
  };
}

const props = defineProps<Props>();

const detailList = ref<StocktakingDetail[]>([]);
const detailLoading = ref(false);

// 计算列：在进行中状态显示操作列，否则隐藏
const displayColumns = computed(() => {
  if (props.formInline.task?.status === "IN_PROGRESS") {
    return detailColumns;
  }
  return detailColumns.filter(col => col.slot !== "operation");
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

  try {
    const { value } = await ElMessageBox.prompt(
      `当前系统库存: ${detail.bookCount}`,
      "录入实际库存",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: String(detail.actualCount || detail.bookCount),
        inputPattern: /^\d+$/,
        inputErrorMessage: "请输入有效数量"
      }
    );

    await updateInventoryCheckDetailsApi(props.formInline.task.id, {
      details: [
        {
          detailId: detail.id,
          actualCount: parseInt(value),
          remark: detail.remark
        }
      ]
    });

    ElMessage.success("更新成功");
    loadDetails();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error, "更新失败");
    }
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
</template>

<style scoped>
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

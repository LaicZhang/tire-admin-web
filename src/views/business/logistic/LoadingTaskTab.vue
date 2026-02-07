<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "../../../utils/constants";
import { ref, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Add from "~icons/ep/plus";
import { getLoadingTaskListApi, createLoadingTaskApi } from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import StatusTag from "@/components/StatusTag/index.vue";
import { type LoadingTask, loadingTaskStatusMap } from "./types";
import LoadingTaskDialog from "./LoadingTaskDialog.vue";
import type { CreateLoadingTaskDto } from "@/api";

defineOptions({
  name: "LoadingTaskTab"
});

const dataList = ref<LoadingTask[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const dialogVisible = ref(false);

const columns = ref([
  {
    label: "任务编号",
    prop: "uid",
    minWidth: 200
  },
  {
    label: "车牌号",
    prop: "vehicleNo",
    minWidth: 120
  },
  {
    label: "司机",
    prop: "driverName",
    minWidth: 100
  },
  {
    label: "装车时间",
    prop: "loadingTime",
    minWidth: 160,
    formatter: (_row: LoadingTask, _column: unknown, cellValue: unknown) => {
      return cellValue ? new Date(String(cellValue)).toLocaleString() : "-";
    }
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "createdAt",
    minWidth: 160,
    formatter: (_row: LoadingTask, _column: unknown, cellValue: unknown) => {
      return cellValue ? new Date(String(cellValue)).toLocaleString() : "-";
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 120
  }
]);

async function loadData() {
  loading.value = true;
  try {
    const { data, code, msg } = await getLoadingTaskListApi(
      pagination.value.currentPage
    );
    if (code === 200) {
      const typedData = data as { list?: LoadingTask[]; count?: number };
      dataList.value = typedData.list || [];
      pagination.value.total = typedData.count || 0;
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载装车任务列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await loadData();
}

function handleAdd() {
  dialogVisible.value = true;
}

async function handleCreate(formData: CreateLoadingTaskDto) {
  try {
    const { code, msg } = await createLoadingTaskApi(formData);
    if (code === 200) {
      message("创建成功", { type: "success" });
      dialogVisible.value = false;
      await loadData();
    } else {
      message(msg || "创建失败", { type: "error" });
    }
  } catch {
    message("创建装车任务失败", { type: "error" });
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div>
    <PureTableBar title="装车任务列表" @refresh="loadData">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)" @click="handleAdd">
          新建装车任务
        </el-button>
      </template>
      <template v-slot="{ size }">
        <pure-table
          row-key="uid"
          adaptive
          :size
          :columns
          border
          :data="dataList"
          :loading="loading"
          showOverflowTooltip
          :pagination="{ ...pagination, size }"
          @page-current-change="handleCurrentChange"
        >
          <template #status="{ row }">
            <StatusTag
              :status="row.status"
              :status-map="loadingTaskStatusMap"
            />
          </template>
          <template #operation>
            <el-button class="reset-margin" link type="primary">
              查看
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <LoadingTaskDialog v-model:visible="dialogVisible" @submit="handleCreate" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import Add from "~icons/ep/plus";
import { getShippingPlanListApi, createShippingPlanApi } from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  type ShippingPlan,
  ShippingPlanStatus,
  shippingPlanStatusMap
} from "./types";
import ShippingPlanDialog from "./ShippingPlanDialog.vue";

defineOptions({
  name: "ShippingPlanTab"
});

const dataList = ref<ShippingPlan[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const dialogVisible = ref(false);

const columns = ref([
  {
    label: "计划编号",
    prop: "uid",
    minWidth: 200
  },
  {
    label: "计划名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "计划日期",
    prop: "plannedDate",
    minWidth: 120,
    formatter: (_row: ShippingPlan, _column: unknown, cellValue: unknown) => {
      return cellValue ? new Date(String(cellValue)).toLocaleDateString() : "-";
    }
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "关联订单数",
    prop: "orderCount",
    minWidth: 100
  },
  {
    label: "创建时间",
    prop: "createdAt",
    minWidth: 160,
    formatter: (_row: ShippingPlan, _column: unknown, cellValue: unknown) => {
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
    const { data, code, msg } = await getShippingPlanListApi(
      pagination.value.currentPage
    );
    if (code === 200) {
      const typedData = data as { list?: ShippingPlan[]; count?: number };
      dataList.value = typedData.list || [];
      pagination.value.total = typedData.count || 0;
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载发运计划列表失败", { type: "error" });
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

async function handleCreate(formData: any) {
  try {
    const { code, msg } = await createShippingPlanApi(formData);
    if (code === 200) {
      message("创建成功", { type: "success" });
      dialogVisible.value = false;
      await loadData();
    } else {
      message(msg || "创建失败", { type: "error" });
    }
  } catch {
    message("创建发运计划失败", { type: "error" });
  }
}

function getStatusType(status: ShippingPlanStatus) {
  return shippingPlanStatusMap[status]?.type || "info";
}

function getStatusLabel(status: ShippingPlanStatus) {
  return shippingPlanStatusMap[status]?.label || status;
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div>
    <PureTableBar title="发运计划列表" @refresh="loadData">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)" @click="handleAdd">
          新建发运计划
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
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
          <template #operation>
            <el-button class="reset-margin" link type="primary">
              查看
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <ShippingPlanDialog
      v-model:visible="dialogVisible"
      @submit="handleCreate"
    />
  </div>
</template>

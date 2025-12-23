<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Add from "~icons/ep/plus";
import { getShippingWaveListApi, createShippingWaveApi } from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  type ShippingWave,
  ShippingWaveStatus,
  shippingWaveStatusMap
} from "./types";
import ShippingWaveDialog from "./ShippingWaveDialog.vue";

defineOptions({
  name: "ShippingWaveTab"
});

const dataList = ref<ShippingWave[]>([]);
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
    label: "波次编号",
    prop: "uid",
    minWidth: 200
  },
  {
    label: "波次名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "发货日期",
    prop: "shippingDate",
    minWidth: 120,
    formatter: (row, column, cellValue) => {
      return cellValue ? new Date(cellValue).toLocaleDateString() : "-";
    }
  },
  {
    label: "仓库",
    prop: "warehouseName",
    minWidth: 120
  },
  {
    label: "订单数",
    prop: "orderCount",
    minWidth: 80
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
    formatter: (row, column, cellValue) => {
      return cellValue ? new Date(cellValue).toLocaleString() : "-";
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
    const { data, code, msg } = await getShippingWaveListApi(
      pagination.value.currentPage
    );
    if (code === 200) {
      dataList.value = data?.list || [];
      pagination.value.total = data?.count || 0;
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载发货波次列表失败", { type: "error" });
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
    const { code, msg } = await createShippingWaveApi(formData);
    if (code === 200) {
      message("创建成功", { type: "success" });
      dialogVisible.value = false;
      await loadData();
    } else {
      message(msg || "创建失败", { type: "error" });
    }
  } catch {
    message("创建发货波次失败", { type: "error" });
  }
}

function getStatusType(status: ShippingWaveStatus) {
  return shippingWaveStatusMap[status]?.type || "info";
}

function getStatusLabel(status: ShippingWaveStatus) {
  return shippingWaveStatusMap[status]?.label || status;
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div>
    <PureTableBar title="发货波次列表" @refresh="loadData">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)" @click="handleAdd">
          新建发货波次
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

    <ShippingWaveDialog
      v-model:visible="dialogVisible"
      @submit="handleCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import {
  getLogisticListApi,
  updateLogisticApi,
  cancelLogisticApi
} from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import ShippingPlanTab from "./ShippingPlanTab.vue";
import LoadingTaskTab from "./LoadingTaskTab.vue";
import ShippingWaveTab from "./ShippingWaveTab.vue";
import LogisticDetailDrawer from "./LogisticDetailDrawer.vue";
import type { LogisticOrder } from "./types";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "Logistic"
});

const activeTab = ref("logistic");
const drawerVisible = ref(false);
const currentLogistic = ref<LogisticOrder | null>(null);

const dataList = ref<LogisticOrder[]>([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  type: undefined,
  isArrival: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const orderTypeOptions = [
  { label: "采购订单", value: "purchase-order" },
  { label: "销售订单", value: "sale-order" },
  { label: "退货订单", value: "return-order" },
  { label: "调拨订单", value: "transfer-order" }
];

const columns = ref<TableColumnList>([
  {
    label: "订单UID",
    prop: "uid"
  },
  {
    label: "订单类型",
    prop: "type",
    formatter: (row, column, cellValue) => {
      const option = orderTypeOptions.find(opt => opt.value === cellValue);
      return option ? option.label : cellValue;
    }
  },
  {
    label: "物流状态",
    prop: "logisticsStatus",
    formatter: (row, column, cellValue) => {
      const statusMap: Record<string, string> = {
        0: "待发货",
        1: "运送中",
        2: "已送达"
      };
      return statusMap[String(cellValue)] || "未知";
    }
  },
  {
    label: "是否已到达",
    prop: "isArrival",
    formatter: (row, column, cellValue) => {
      return cellValue ? "是" : "否";
    }
  },
  {
    label: "发货时间",
    prop: "departureAt",
    formatter: (row, column, cellValue) => {
      return cellValue ? new Date(cellValue).toLocaleString() : "-";
    }
  },
  {
    label: "到达时间",
    prop: "arrivalAt",
    formatter: (row, column, cellValue) => {
      return cellValue ? new Date(cellValue).toLocaleString() : "-";
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 240
  }
]);

const getLogisticListInfo = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getLogisticListApi(
      pagination.value.currentPage,
      {
        type: form.value.type,
        isArrival: form.value.isArrival
      }
    );
    if (code === 200) {
      const typedData = data as { list?: LogisticOrder[]; count?: number };
      dataList.value = typedData.list || [];
      pagination.value.total = typedData.count || 0;
    } else {
      message(msg, { type: "error" });
    }
  } catch (error) {
    message(error.message || "获取物流列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const onSearch = async () => {
  pagination.value.currentPage = 1;
  await getLogisticListInfo();
};

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getLogisticListInfo();
}

async function handleConfirmShipment(row: LogisticOrder) {
  try {
    await updateLogisticApi(row.uid, {
      type: row.type,
      isArrival: false
    });
    message("确认发货成功", { type: "success" });
    await getLogisticListInfo();
  } catch (error) {
    message(error.message || "确认发货失败", { type: "error" });
  }
}

async function handleConfirmArrival(row: LogisticOrder) {
  try {
    await updateLogisticApi(row.uid, {
      type: row.type,
      isArrival: true
    });
    message("确认送达成功", { type: "success" });
    await getLogisticListInfo();
  } catch (error) {
    message(error.message || "确认送达失败", { type: "error" });
  }
}

async function handleCancel(row: LogisticOrder) {
  try {
    await cancelLogisticApi(row.uid, row.type);
    message("取消物流状态成功", { type: "success" });
    await getLogisticListInfo();
  } catch (error) {
    message(error.message || "取消物流状态失败", { type: "error" });
  }
}

function handleViewDetail(row: LogisticOrder) {
  currentLogistic.value = row;
  drawerVisible.value = true;
}

onMounted(async () => {
  await getLogisticListInfo();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 物流单列表 Tab -->
        <el-tab-pane label="物流单" name="logistic">
          <el-form
            ref="formRef"
            :inline="true"
            class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
          >
            <el-form-item label="订单类型：" prop="type">
              <el-select
                v-model="form.type"
                placeholder="请选择订单类型"
                clearable
                class="w-[180px]!"
              >
                <el-option
                  v-for="item in orderTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="是否已到达：" prop="isArrival">
              <el-select
                v-model="form.isArrival"
                placeholder="请选择"
                clearable
                class="w-[180px]!"
              >
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :icon="useRenderIcon('ri:search-line')"
                :loading="loading"
                @click="onSearch"
              >
                搜索
              </el-button>
              <el-button
                :icon="useRenderIcon(Refresh)"
                @click="resetForm(formRef)"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>

          <PureTableBar title="物流单列表" @refresh="getLogisticListInfo">
            <template v-slot="{ size }">
              <pure-table
                row-key="uid"
                adaptive
                :size
                :columns
                border
                :data="dataList"
                showOverflowTooltip
                :pagination="{ ...pagination, size }"
                @page-current-change="handleCurrentChange"
              >
                <template #operation="{ row }">
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    @click="handleViewDetail(row)"
                  >
                    详情
                  </el-button>

                  <el-button
                    v-if="!row.isArrival && row.logisticsStatus === 0"
                    class="reset-margin"
                    link
                    type="success"
                    @click="handleConfirmShipment(row)"
                  >
                    确认发货
                  </el-button>

                  <el-button
                    v-if="!row.isArrival && row.logisticsStatus === 1"
                    class="reset-margin"
                    link
                    type="success"
                    @click="handleConfirmArrival(row)"
                  >
                    确认送达
                  </el-button>

                  <el-button
                    v-if="!row.isArrival"
                    class="reset-margin"
                    link
                    type="danger"
                    @click="handleCancel(row)"
                  >
                    取消
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </el-tab-pane>

        <!-- 发运计划 Tab -->
        <el-tab-pane label="发运计划" name="shippingPlan">
          <ShippingPlanTab />
        </el-tab-pane>

        <!-- 装车任务 Tab -->
        <el-tab-pane label="装车任务" name="loadingTask">
          <LoadingTaskTab />
        </el-tab-pane>

        <!-- 发货波次 Tab -->
        <el-tab-pane label="发货波次" name="shippingWave">
          <ShippingWaveTab />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 物流详情抽屉 -->
    <LogisticDetailDrawer
      v-model:visible="drawerVisible"
      :logistic="currentLogistic"
      @refresh="getLogisticListInfo"
    />
  </div>
</template>

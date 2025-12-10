<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import {
  getLogisticListApi,
  getLogisticApi,
  updateLogisticApi,
  cancelLogisticApi
} from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "Logistic"
});

const dataList = ref([]);
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

const columns = ref([
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
      const statusMap = {
        0: "待发货",
        1: "运送中",
        2: "已送达"
      };
      return statusMap[cellValue] || "未知";
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
    minWidth: 200
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
      dataList.value = data.list || [];
      pagination.value.total = data.count || 0;
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

const resetForm = formEl => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getLogisticListInfo();
}

async function handleConfirmShipment(row) {
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

async function handleConfirmArrival(row) {
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

async function handleCancel(row) {
  try {
    await cancelLogisticApi(row.uid, row.type);
    message("取消物流状态成功", { type: "success" });
    await getLogisticListInfo();
  } catch (error) {
    message(error.message || "取消物流状态失败", { type: "error" });
  }
}

onMounted(async () => {
  await getLogisticListInfo();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
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
          <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="getLogisticListInfo">
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import Refresh from "~icons/ep/refresh";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getStockAlertListApi,
  createStockAlertApi,
  scanStockAlertApi
} from "@/api/business/stock-alert";
import { message } from "@/utils";
import type { CommonResult } from "@/api/type";
import type { StockAlert, StockAlertDto } from "@/api/business/stock-alert";
import StockAlertForm from "./StockAlertForm.vue";
import { columns } from "./columns";
import { useAlertCrud } from "../alert/useAlertCrud";

defineOptions({
  name: "StockAlert"
});

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange,
  openDialog
} = useAlertCrud<StockAlert, CommonResult<StockAlert[]>, StockAlertDto>({
  title: "库存预警配置",
  formComponent: StockAlertForm,
  defaultForm: () => ({
    tireId: "",
    minQuantity: 0
  }),
  listApi: async () => getStockAlertListApi(),
  createApi: createStockAlertApi,
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "加载失败", { type: "error" });
      return { list: [], total: 0 };
    }
    const list = res.data ?? [];
    return {
      list,
      total: list.length
    };
  },
  normalizeSubmit: form => ({
    ...form,
    tireId: String(form.tireId || "").trim()
  })
});

const handleScan = async () => {
  const { code, msg } = await scanStockAlertApi();
  if (code === 200) {
    message("触发扫描成功", { type: "success" });
  } else {
    message(msg, { type: "error" });
  }
};
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <PureTableBar title="库存预警管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增配置
          </el-button>
          <el-button
            type="success"
            :icon="useRenderIcon(Refresh)"
            @click="handleScan"
          >
            触发扫描
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size="size"
            :columns="columns"
            border
            :data="dataList"
            :loading="loading"
            :pagination="{ ...pagination, size }"
            @page-current-change="onCurrentChange"
          />
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

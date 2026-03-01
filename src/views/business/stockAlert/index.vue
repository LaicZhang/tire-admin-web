<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { h, ref } from "vue";
import type { FormInstance } from "element-plus";
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
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";
import type { StockAlert, StockAlertDto } from "@/api/business/stock-alert";
import StockAlertForm from "./StockAlertForm.vue";

defineOptions({
  name: "StockAlert"
});

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange
} = useCrud<StockAlert, CommonResult<StockAlert[]>, { page: number }>({
  api: () => getStockAlertListApi(),
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  },
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
  immediate: true
});

const columns = [
  {
    label: "轮胎ID",
    prop: "tireId"
  },
  {
    label: "最低库存",
    prop: "minQuantity"
  }
];

const handleScan = async () => {
  const { code, msg } = await scanStockAlertApi();
  if (code === 200) {
    message("触发扫描成功", { type: "success" });
  } else {
    message(msg, { type: "error" });
  }
};

function openDialog(title = "新增") {
  const dialogFormRef = ref<{ getRef: () => FormInstance | undefined }>();
  addDialog({
    title: `${title}库存预警配置`,
    props: {
      formInline: {
        tireId: "",
        minQuantity: 0
      } as StockAlertDto
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(StockAlertForm, {
        ref: dialogFormRef,
        formInline: (options.props as { formInline: StockAlertDto }).formInline
      }),
    beforeSure: async (done, { options }) => {
      const valid = await dialogFormRef.value
        ?.getRef()
        ?.validate()
        .catch(() => false);
      if (!valid) return;

      const data = (options.props as { formInline: StockAlertDto }).formInline;
      data.tireId = String(data.tireId || "").trim();
      createStockAlertApi(data).then(() => {
        message("操作成功", { type: "success" });
        done();
        getData();
      });
    }
  });
}
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

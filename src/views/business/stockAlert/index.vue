<script setup lang="ts">
import { ref, h } from "vue";
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
    pageSize: 10,
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
    contentRenderer: ({ options }) => {
      const { formInline } = options.props as {
        formInline: StockAlertDto;
      };
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "80px" }, [
          h("el-form-item", { label: "轮胎ID", required: true }, [
            h("el-input", {
              modelValue: formInline.tireId,
              "onUpdate:modelValue": (val: string) => (formInline.tireId = val),
              placeholder: "请输入轮胎ID"
            })
          ]),
          h("el-form-item", { label: "最低库存" }, [
            h("el-input-number", {
              modelValue: formInline.minQuantity,
              "onUpdate:modelValue": (val: number | undefined) =>
                (formInline.minQuantity = val ?? 0),
              min: 0
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = (options.props as { formInline: StockAlertDto }).formInline;
      if (!data.tireId) {
        message("请输入轮胎ID", { type: "warning" });
        return;
      }
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

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

defineOptions({
  name: "StockAlert"
});

interface StockAlertItem {
  id: number;
  uid: string;
  name: string;
  tireSpec: string;
  safeStock: number;
  maxStock: number;
  minStock: number;
  desc: string;
}

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange
} = useCrud<
  StockAlertItem,
  CommonResult<StockAlertItem[]>,
  { page: number; pageSize: number }
>({
  api: ({ page, pageSize }) =>
    getStockAlertListApi({ page, pageSize }) as Promise<
      CommonResult<StockAlertItem[]>
    >,
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
    label: "预警规则",
    prop: "name"
  },
  {
    label: "轮胎规格",
    prop: "tireSpec"
  },
  {
    label: "安全库存",
    prop: "safeStock"
  },
  {
    label: "最高库存",
    prop: "maxStock"
  },
  {
    label: "最低库存",
    prop: "minStock"
  },
  {
    label: "备注",
    prop: "desc"
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

interface StockAlertFormInline {
  name: string;
  tireSpec: string;
  safeStock: number;
  maxStock: number;
  minStock: number;
  desc: string;
}

function openDialog(title = "新增") {
  addDialog({
    title: `${title}库存预警配置`,
    props: {
      formInline: {
        name: "",
        tireSpec: "",
        safeStock: 0,
        maxStock: 0,
        minStock: 0,
        desc: ""
      } as StockAlertFormInline
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const { formInline } = options.props as {
        formInline: StockAlertFormInline;
      };
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "80px" }, [
          h("el-form-item", { label: "规则名称", required: true }, [
            h("el-input", {
              modelValue: formInline.name,
              "onUpdate:modelValue": (val: string) => (formInline.name = val),
              placeholder: "请输入规则名称"
            })
          ]),
          h("el-form-item", { label: "轮胎规格" }, [
            h("el-input", {
              modelValue: formInline.tireSpec,
              "onUpdate:modelValue": (val: string) =>
                (formInline.tireSpec = val),
              placeholder: "暂支持手动输入，后续关联商品选择"
            })
          ]),
          h("el-form-item", { label: "安全库存" }, [
            h("el-input-number", {
              modelValue: formInline.safeStock,
              "onUpdate:modelValue": (val: number | undefined) =>
                (formInline.safeStock = val ?? 0),
              min: 0
            })
          ]),
          h("el-form-item", { label: "最低库存" }, [
            h("el-input-number", {
              modelValue: formInline.minStock,
              "onUpdate:modelValue": (val: number | undefined) =>
                (formInline.minStock = val ?? 0),
              min: 0
            })
          ]),
          h("el-form-item", { label: "最高库存" }, [
            h("el-input-number", {
              modelValue: formInline.maxStock,
              "onUpdate:modelValue": (val: number | undefined) =>
                (formInline.maxStock = val ?? 0),
              min: 0
            })
          ]),
          h("el-form-item", { label: "备注" }, [
            h("el-input", {
              modelValue: formInline.desc,
              "onUpdate:modelValue": (val: string) => (formInline.desc = val),
              type: "textarea"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = (options.props as { formInline: StockAlertFormInline })
        .formInline;
      if (!data.name) {
        message("请输入名称", { type: "warning" });
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

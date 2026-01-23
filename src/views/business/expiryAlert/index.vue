<script setup lang="ts">
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getExpiryAlertListApi,
  createExpiryAlertApi
} from "@/api/business/stock-alert";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

defineOptions({
  name: "ExpiryAlert"
});

interface ExpiryAlertItem {
  id: number;
  uid: string;
  repoId: string;
  daysBefore: number;
}

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange
} = useCrud<
  ExpiryAlertItem,
  CommonResult<{ list: ExpiryAlertItem[]; count: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getExpiryAlertListApi({ index: page }) as Promise<
      CommonResult<{ list: ExpiryAlertItem[]; count: number }>
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
    return {
      list: res.data?.list ?? [],
      total: res.data?.count ?? 0
    };
  },
  immediate: true
});

const columns = [
  {
    label: "仓库",
    prop: "repoId"
  },
  {
    label: "提前预警天数",
    prop: "daysBefore"
  }
];

function openDialog(title = "新增") {
  addDialog({
    title: `${title}效期预警配置`,
    props: {
      formInline: {
        repoId: "",
        daysBefore: 30
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const { formInline } = options.props as {
        formInline: { repoId: string; daysBefore: number };
      };
      return h("div", [
        h("el-form", { model: formInline, labelWidth: "100px" }, [
          h("el-form-item", { label: "仓库ID（可选）" }, [
            h("el-input", {
              modelValue: formInline.repoId,
              "onUpdate:modelValue": (val: string) => (formInline.repoId = val),
              placeholder: "为空表示所有仓库"
            })
          ]),
          h("el-form-item", { label: "提前预警天数" }, [
            h("el-input-number", {
              modelValue: formInline.daysBefore,
              "onUpdate:modelValue": (val: number) =>
                (formInline.daysBefore = val),
              min: 1
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = (
        options.props as { formInline: { repoId: string; daysBefore: number } }
      ).formInline;
      createExpiryAlertApi({
        repoId: data.repoId || undefined,
        daysBefore: data.daysBefore
      }).then(() => {
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
      <PureTableBar title="效期预警管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增配置
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

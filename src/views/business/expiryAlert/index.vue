<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { h, ref } from "vue";
import type { FormInstance } from "element-plus";
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
import ExpiryAlertForm from "./ExpiryAlertForm.vue";

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
    pageSize: PAGE_SIZE_SMALL,
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
  const dialogFormRef = ref<{ getRef: () => FormInstance | undefined }>();
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
    contentRenderer: ({ options }) =>
      h(ExpiryAlertForm, {
        ref: dialogFormRef,
        formInline: (
          options.props as {
            formInline: { repoId: string; daysBefore: number };
          }
        ).formInline
      }),
    beforeSure: async (done, { options }) => {
      const valid = await dialogFormRef.value
        ?.getRef()
        ?.validate()
        .catch(() => false);
      if (!valid) return;

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

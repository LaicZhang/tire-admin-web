<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getExpiryAlertListApi,
  createExpiryAlertApi
} from "@/api/business/stock-alert";
import { message } from "@/utils";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import ExpiryAlertForm from "./ExpiryAlertForm.vue";
import { columns } from "./columns";
import { useAlertCrud } from "../alert/useAlertCrud";

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
  onCurrentChange,
  openDialog
} = useAlertCrud<
  ExpiryAlertItem,
  CommonResult<PaginatedResponseDto<ExpiryAlertItem>>,
  { repoId: string; daysBefore: number },
  { repoId?: string; daysBefore: number }
>({
  title: "效期预警配置",
  formComponent: ExpiryAlertForm,
  defaultForm: () => ({
    repoId: "",
    daysBefore: 30
  }),
  listApi: page =>
    getExpiryAlertListApi({ index: page }) as Promise<
      CommonResult<PaginatedResponseDto<ExpiryAlertItem>>
    >,
  createApi: createExpiryAlertApi,
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "加载失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.total ?? 0
    };
  },
  normalizeSubmit: form => ({
    repoId: form.repoId || undefined,
    daysBefore: form.daysBefore
  })
});
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

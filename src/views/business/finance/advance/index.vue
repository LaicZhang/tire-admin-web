<script setup lang="ts">
import { ref } from "vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getAdvancePaymentList,
  type AdvancePaymentDto
} from "@/api/business/advance-payment";
import { message } from "@/utils/message";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

defineOptions({
  name: "AdvancePaymentList"
});

const form = ref({
  type: "",
  targetName: ""
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  AdvancePaymentDto,
  CommonResult<{ list: AdvancePaymentDto[]; total?: number; count?: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page, pageSize }) =>
    getAdvancePaymentList({
      page,
      pageSize,
      ...form.value
    }) as unknown as Promise<CommonResult<{ list: AdvancePaymentDto[]; total?: number; count?: number }>>,
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
      total: res.data?.total ?? res.data?.count ?? 0
    };
  },
  immediate: true
});

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

function onReset() {
  searchFormRef.value?.resetFields();
  onSearch();
}

function handleAdd() {
  message("功能开发中", { type: "info" });
}

function handleDelete(_row: AdvancePaymentDto) {
  message("功能开发中", { type: "info" });
}
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="相关类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[160px]"
        >
          <el-option label="预收款" value="RECEIPT" />
          <el-option label="预付款" value="PAYMENT" />
        </el-select>
      </el-form-item>
      <el-form-item label="往来单位" prop="targetName">
        <el-input
          v-model="form.targetName"
          placeholder="请输入单位名称"
          clearable
          class="w-[160px]"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="预收预付列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="val => (pagination.pageSize = val) && onSearch()"
          @page-current-change="
            val => (pagination.currentPage = val) && onSearch()
          "
        >
          <template #operation="{ row }">
            <DeleteButton
              :show-icon="false"
              size="small"
              @confirm="handleDelete(row)"
            />
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

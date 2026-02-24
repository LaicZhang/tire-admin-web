<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, reactive } from "vue";
import { columns } from "./columns";
import { getOtherTransactionListApi } from "@/api/finance";
import type { OtherTransaction } from "@/api/finance";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Add from "~icons/ep/plus";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";
import { message } from "@/utils/message";

defineOptions({
  name: "FinanceExpense"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = reactive({
  type: "",
  startDate: "",
  endDate: ""
});

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  OtherTransaction,
  CommonResult<{ list: OtherTransaction[]; total?: number; count?: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getOtherTransactionListApi(page, {
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate
    }) as Promise<
      CommonResult<{ list: OtherTransaction[]; total?: number; count?: number }>
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
      total: res.data?.total ?? res.data?.count ?? 0
    };
  },
  immediate: true
});

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};
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
      <el-form-item label="类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[180px]"
        >
          <el-option label="收入" value="income" />
          <el-option label="支出" value="expense" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围" prop="date">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
          class="w-[180px]"
        />
        <span class="mx-2">-</span>
        <el-date-picker
          v-model="form.endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="收支明细" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)">
          新增记录
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
          @page-size-change="onSearch"
          @page-current-change="onSearch"
        />
      </template>
    </PureTableBar>
  </div>
</template>

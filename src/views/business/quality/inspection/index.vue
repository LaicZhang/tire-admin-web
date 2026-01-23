<script setup lang="ts">
import { ref, reactive } from "vue";
import { columns } from "./columns";
import {
  getInspectionRecordListApi,
  type InspectionRecord
} from "@/api/business/quality";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Add from "~icons/ep/plus";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";
import { message } from "@/utils/message";

defineOptions({
  name: "QualityInspection"
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = reactive({
  purchaseOrderNo: "",
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
  InspectionRecord,
  CommonResult<{ list: InspectionRecord[]; total?: number; count?: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getInspectionRecordListApi(page, { ...form }) as Promise<
      CommonResult<{ list: InspectionRecord[]; total?: number; count?: number }>
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
      <el-form-item label="采购单号" prop="purchaseOrderNo">
        <el-input
          v-model="form.purchaseOrderNo"
          placeholder="请输入单号"
          clearable
        />
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

    <PureTableBar title="质检记录" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)">
          新增质检
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

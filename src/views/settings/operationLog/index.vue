<script setup lang="tsx">
import { ref, computed } from "vue";
import { columns } from "./columns";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { PureTableBar } from "@/components/RePureTableBar";
import { getOperationLogsApi } from "@/api/setting";
import { message } from "@/utils";
import type { OperationLog } from "./types";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";

defineOptions({
  name: "OperationLog"
});

const state = ref({
  username: "",
  operationType: "",
  moduleName: "",
  dateRange: [] as string[]
});

const buildParams = () => {
  const params: Record<string, unknown> = {
    username: state.value.username || undefined,
    operationType: state.value.operationType || undefined,
    moduleName: state.value.moduleName || undefined
  };
  if (state.value.dateRange?.length === 2) {
    params.startTime = state.value.dateRange[0];
    params.endTime = state.value.dateRange[1];
  }
  return params;
};

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  OperationLog,
  CommonResult<PaginatedResponseDto<OperationLog>>,
  { page: number; pageSize: number }
>({
  api: ({ page, pageSize }) =>
    getOperationLogsApi({ page, pageSize, ...buildParams() }),
  pagination: {
    pageSize: 20,
    currentPage: 1,
    pageSizes: [10, 20, 50, 100],
    background: true,
    layout: "total, sizes, prev, pager, next, jumper"
  },
  transform: res => {
    if (res.code !== 200) {
      message("加载操作日志失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.count ?? res.data?.total ?? 0
    };
  },
  immediate: true
});

const formColumns: PlusColumn[] = [
  {
    label: "操作人",
    prop: "username",
    valueType: "copy"
  },
  {
    label: "操作类型",
    prop: "operationType",
    valueType: "select",
    options: [
      { label: "新增", value: "create" },
      { label: "修改", value: "update" },
      { label: "删除", value: "delete" },
      { label: "查询", value: "query" },
      { label: "导入", value: "import" },
      { label: "导出", value: "export" },
      { label: "审核", value: "audit" },
      { label: "反审核", value: "unaudit" },
      { label: "登录", value: "login" },
      { label: "登出", value: "logout" }
    ]
  },
  {
    label: "访问页面",
    prop: "moduleName",
    valueType: "select",
    options: [
      { label: "采购管理", value: "purchase" },
      { label: "销售管理", value: "sales" },
      { label: "库存管理", value: "inventory" },
      { label: "资金管理", value: "finance" },
      { label: "基础资料", value: "basic" },
      { label: "系统设置", value: "system" }
    ]
  },
  {
    label: "操作时间",
    prop: "dateRange",
    valueType: "date-picker",
    fieldProps: {
      type: "daterange",
      rangeSeparator: "至",
      startPlaceholder: "开始日期",
      endPlaceholder: "结束日期",
      valueFormat: "YYYY-MM-DD"
    }
  }
];

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const handleReset = () => {
  state.value = {
    username: "",
    operationType: "",
    moduleName: "",
    dateRange: []
  };
  handleSearch();
};
</script>

<template>
  <div class="main">
    <PlusSearch
      v-model="state"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="formColumns"
      :show-number="4"
      label-width="80"
      label-position="right"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="bg-white p-4 rounded-md">
      <PureTableBar title="操作日志" @refresh="fetchData">
        <template #default>
          <pure-table
            border
            adaptive
            row-key="uid"
            alignWhole="center"
            showOverflowTooltip
            :loading="loading"
            :data="dataList"
            :columns="columns"
            :pagination="pagination"
            @page-size-change="onSizeChange"
            @page-current-change="onCurrentChange"
          />
        </template>
      </PureTableBar>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}
</style>

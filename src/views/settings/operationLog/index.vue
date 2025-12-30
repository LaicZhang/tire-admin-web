<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { PureTableBar } from "@/components/RePureTableBar";
import type { PaginationProps } from "@pureadmin/table";
import { getOperationLogsApi } from "@/api/setting";
import { message } from "@/utils";
import type { OperationLog } from "./types";

defineOptions({
  name: "OperationLog"
});

const loading = ref(false);
const dataList = ref<OperationLog[]>([]);

const state = ref({
  username: "",
  operationType: "",
  moduleName: "",
  dateRange: []
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

const columns: TableColumnList = [
  {
    label: "操作人",
    prop: "username",
    minWidth: 100
  },
  {
    label: "操作时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "访问页面",
    prop: "moduleName",
    minWidth: 120
  },
  {
    label: "操作类型",
    prop: "operationTypeName",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      const typeMap: Record<string, { type: string; label: string }> = {
        create: { type: "success", label: "新增" },
        update: { type: "primary", label: "修改" },
        delete: { type: "danger", label: "删除" },
        query: { type: "info", label: "查询" },
        import: { type: "warning", label: "导入" },
        export: { type: "warning", label: "导出" },
        audit: { type: "success", label: "审核" },
        unaudit: { type: "warning", label: "反审核" },
        login: { type: "success", label: "登录" },
        logout: { type: "info", label: "登出" }
      };
      const item = typeMap[row.operationType] || {
        type: "info",
        label: row.operationType
      };
      return (
        <el-tag type={item.type} effect="plain">
          {item.label}
        </el-tag>
      );
    }
  },
  {
    label: "操作详情",
    prop: "detail",
    minWidth: 250
  },
  {
    label: "IP地址",
    prop: "ip",
    minWidth: 130
  }
];

const pagination = reactive<PaginationProps>({
  pageSize: 20,
  currentPage: 1,
  pageSizes: [10, 20, 50, 100],
  total: 0,
  align: "right",
  background: true,
  layout: "total, sizes, prev, pager, next, jumper"
});

const loadData = async () => {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      username: state.value.username,
      operationType: state.value.operationType,
      moduleName: state.value.moduleName
    };

    if (
      Array.isArray(state.value.dateRange) &&
      state.value.dateRange.length === 2
    ) {
      params.startTime = state.value.dateRange[0];
      params.endTime = state.value.dateRange[1];
    }

    Object.keys(params).forEach(key => {
      if (
        params[key] === "" ||
        params[key] === undefined ||
        params[key] === null
      ) {
        delete params[key];
      }
    });

    const { code, data } = await getOperationLogsApi(params);
    if (code === 200 && data) {
      const result = data as {
        list?: OperationLog[];
        total?: number;
        count?: number;
      };
      dataList.value = result.list ?? [];
      pagination.total = result.total ?? result.count ?? 0;
    } else {
      dataList.value = [];
      pagination.total = 0;
    }
  } catch {
    message("加载操作日志失败", { type: "error" });
    dataList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.currentPage = 1;
  loadData();
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

const onSizeChange = (val: number) => {
  pagination.pageSize = val;
  loadData();
};

const onCurrentChange = (val: number) => {
  pagination.currentPage = val;
  loadData();
};

onMounted(() => {
  loadData();
});
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
      <PureTableBar title="操作日志" @refresh="loadData">
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
.main {
  margin: 20px;
}
</style>

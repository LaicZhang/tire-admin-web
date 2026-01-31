<script setup lang="ts">
import { getLogApi } from "@/api";
import { getOperationLogListApi } from "@/api/system/log";
import { onMounted, ref } from "vue";
import { useColumns } from "./columns";

defineOptions({
  name: "history"
});

const tableRef = ref();
const {
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  adaptiveConfig,
  onSizeChange,
  onCurrentChange
} = useColumns();
const type = ref<1 | 2>(1);

async function getHistory() {
  dataList.value = [];
  loading.value = true;
  const params: Record<string, unknown> = {};
  const page = pagination.currentPage || 1;

  try {
    if (type.value === 1) {
      // Login History
      const { data, code } = await getLogApi(page, params);
      handleApiResponse({ data: data as ApiResponseData, code });
    } else if (type.value === 2) {
      // Operation History
      const { data, code } = await getOperationLogListApi(page, params);
      handleApiResponse({ data: data as ApiResponseData, code });
    }
  } finally {
    loading.value = false;
  }
}

// API response data interface
interface HistoryRow {
  id?: string | number;
  module?: string;
  method?: string;
  success?: boolean;
  operator?: string;
  ip?: string;
  record?: {
    os?: string;
    browser?: string;
  };
  createAt?: string;
}

interface ApiResponseData {
  list: HistoryRow[];
  total?: number;
  count?: number;
}

async function handleApiResponse({
  data,
  code
}: {
  data: ApiResponseData;
  code: number;
}) {
  if (code === 200) {
    dataList.value = data.list;
    pagination.total = data.total || data.count || 0;
    loading.value = false;
  } else {
    loading.value = false;
  }
}

onMounted(async () => {
  await getHistory();
});
</script>

<template>
  <div class="mb-2 items-center text-sm">
    <el-card class="m-1">
      <el-radio-group v-model="type" @change="getHistory">
        <el-radio :value="1">登录记录</el-radio>
        <el-radio :value="2">操作记录</el-radio>
      </el-radio-group>
    </el-card>

    <el-card class="m-1">
      <pure-table
        ref="tableRef"
        border
        adaptive
        :adaptiveConfig="adaptiveConfig"
        row-key="id"
        alignWhole="center"
        showOverflowTooltip
        :loading="loading"
        :loading-config="loadingConfig"
        :data="dataList"
        :columns="columns"
        :pagination="pagination"
        @page-size-change="onSizeChange"
        @page-current-change="onCurrentChange"
      />
    </el-card>
  </div>
</template>

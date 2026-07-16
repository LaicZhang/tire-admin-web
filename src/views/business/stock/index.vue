<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { getStockBalancePage } from "@/api";
import type { StockBalanceRow } from "@/api/business/stock-ledger";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";

defineOptions({
  name: "StockTaking"
});

type StockRow = StockBalanceRow & { count: number };

const dataList = ref<StockRow[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref({
  keyword: ""
});
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const getList = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getStockBalancePage(
      pagination.value.currentPage,
      {
        limit: pagination.value.pageSize
      }
    );
    if (code === 200) {
      dataList.value = data.list.map(item => ({
        ...item,
        count: item.availableQuantity
      }));
      pagination.value.total = data.count ?? 0;
    } else {
      message(msg, { type: "error" });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "获取失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const onSearch = async () => {
  pagination.value.currentPage = 1;
  await getList();
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getList();
}

async function handleSizeChange(val: number) {
  pagination.value.pageSize = val;
  pagination.value.currentPage = 1;
  await getList();
}

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="resetForm"
    >
      <el-form-item label="关键字">
        <el-input v-model="form.keyword" placeholder="搜索（预留）" disabled />
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="getList">
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
            @page-size-change="handleSizeChange"
          />
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

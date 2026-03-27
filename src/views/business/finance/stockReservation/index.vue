<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref } from "vue";
import { useRouter } from "vue-router";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import {
  getStockReservationPage,
  type StockReservationQuery,
  type StockReservationRow,
  type StockReservationSourceType,
  type StockReservationStatus
} from "@/api/business/stock-ledger";
import { handleApiError } from "@/utils/error";
import { columns } from "./columns";

defineOptions({
  name: "FinanceStockReservationList"
});

const SOURCE_ROUTE_MAP: Partial<Record<StockReservationSourceType, string>> = {
  SALE_ALLOCATION: "/finance/sale-allocation",
  SALE_DELIVERY_NOTE: "/finance/sale-picking",
  SALE_DIRECT_SHIPMENT: "/finance/sale-picking"
};

const router = useRouter();
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref({
  sourceType: undefined as StockReservationSourceType | undefined,
  status: undefined as StockReservationStatus | undefined,
  sourceUid: undefined as string | undefined
});
const dataList = ref<StockReservationRow[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

function buildQuery(): StockReservationQuery {
  return {
    sourceType: form.value.sourceType,
    status: form.value.status,
    sourceUid: form.value.sourceUid
  };
}

async function loadList() {
  loading.value = true;
  try {
    const { data } = await getStockReservationPage(
      pagination.value.currentPage,
      buildQuery()
    );
    dataList.value = data?.list || [];
    pagination.value.total = data?.count || 0;
  } catch (error) {
    handleApiError(error, "加载统一预占失败");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.value.currentPage = 1;
  loadList();
}

function onReset() {
  searchFormRef.value?.resetFields();
  form.value = {
    sourceType: undefined,
    status: undefined,
    sourceUid: undefined
  };
  pagination.value.currentPage = 1;
  loadList();
}

function canOpenSource(row: StockReservationRow) {
  return Boolean(SOURCE_ROUTE_MAP[row.sourceType]);
}

function handleOpenSource(row: StockReservationRow) {
  const path = SOURCE_ROUTE_MAP[row.sourceType];
  if (!path) {
    return;
  }
  router.push(path);
}

loadList();
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
      <el-form-item label="来源类型">
        <el-select
          v-model="form.sourceType"
          clearable
          placeholder="请选择来源类型"
        >
          <el-option label="销售分配" value="SALE_ALLOCATION" />
          <el-option label="销售发货" value="SALE_DELIVERY_NOTE" />
          <el-option label="直接发货" value="SALE_DIRECT_SHIPMENT" />
          <el-option label="手工锁库" value="RESERVE_LOCK" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" clearable placeholder="请选择状态">
          <el-option label="已预占" value="RESERVED" />
          <el-option label="已拣货" value="PICKED" />
          <el-option label="已释放" value="RELEASED" />
          <el-option label="已消费" value="CONSUMED" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源单号">
        <el-input
          v-model="form.sourceUid"
          placeholder="请输入来源单号"
          clearable
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="统一预占明细" :columns="columns" @refresh="loadList">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          table-layout="auto"
          :size="size"
          :loading="loading"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          @page-size-change="val => (pagination.pageSize = val) && loadList()"
          @page-current-change="
            val => (pagination.currentPage = val) && loadList()
          "
        >
          <template #operation="{ row }">
            <el-button
              v-if="canOpenSource(row)"
              link
              type="primary"
              :size="size"
              @click="handleOpenSource(row)"
            >
              查看来源
            </el-button>
            <span v-else>-</span>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

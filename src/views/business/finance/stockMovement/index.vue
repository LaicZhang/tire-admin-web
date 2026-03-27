<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref } from "vue";
import { useRouter } from "vue-router";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import {
  getStockMovementPage,
  type StockLedgerStatus,
  type StockMovementQuery,
  type StockMovementRow,
  type StockMovementSourceType
} from "@/api/business/stock-ledger";
import { handleApiError } from "@/utils/error";
import { columns } from "./columns";

defineOptions({
  name: "FinanceStockMovementList"
});

const SOURCE_ROUTE_MAP: Partial<Record<StockMovementSourceType, string>> = {
  SALE_ALLOCATION: "/finance/sale-allocation",
  SALE_PICKING: "/finance/sale-picking",
  SALE_DELIVERY_NOTE: "/finance/sale-picking",
  SALE_DIRECT_SHIPMENT: "/finance/sale-picking"
};

const router = useRouter();
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const form = ref({
  sourceType: undefined as StockMovementSourceType | undefined,
  fromStatus: undefined as StockLedgerStatus | undefined,
  toStatus: undefined as StockLedgerStatus | undefined,
  sourceUid: undefined as string | undefined
});
const dataList = ref<StockMovementRow[]>([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

function buildQuery(): StockMovementQuery {
  return {
    sourceType: form.value.sourceType,
    fromStatus: form.value.fromStatus,
    toStatus: form.value.toStatus,
    sourceUid: form.value.sourceUid
  };
}

async function loadList() {
  loading.value = true;
  try {
    const { data } = await getStockMovementPage(
      pagination.value.currentPage,
      buildQuery()
    );
    dataList.value = data?.list || [];
    pagination.value.total = data?.count || 0;
  } catch (error) {
    handleApiError(error, "加载统一库存流水失败");
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
    fromStatus: undefined,
    toStatus: undefined,
    sourceUid: undefined
  };
  pagination.value.currentPage = 1;
  loadList();
}

function canOpenSource(row: StockMovementRow) {
  return Boolean(SOURCE_ROUTE_MAP[row.sourceType]);
}

function handleOpenSource(row: StockMovementRow) {
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
          <el-option label="销售拣货" value="SALE_PICKING" />
          <el-option label="销售发货" value="SALE_DELIVERY_NOTE" />
          <el-option label="采购入库" value="PURCHASE_INBOUND" />
          <el-option label="调拨发货" value="TRANSFER_SHIPMENT" />
          <el-option label="调拨到货" value="TRANSFER_ARRIVAL" />
          <el-option
            label="客户退货到货"
            value="RETURN_FROM_CUSTOMER_ARRIVAL"
          />
          <el-option label="退供应商发货" value="RETURN_TO_PROVIDER_SHIPMENT" />
          <el-option label="退供应商送达" value="RETURN_TO_PROVIDER_DELIVERY" />
          <el-option label="批次交易" value="BATCH_TRANSACTION" />
          <el-option label="库存盘点" value="STOCK_TAKING" />
          <el-option label="手工锁库" value="RESERVE_LOCK" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源状态">
        <el-select
          v-model="form.fromStatus"
          clearable
          placeholder="请选择来源状态"
        >
          <el-option label="可用" value="AVAILABLE" />
          <el-option label="已预占" value="RESERVED" />
          <el-option label="已拣货" value="PICKED" />
          <el-option label="在途" value="IN_TRANSIT" />
          <el-option label="质检" value="QC" />
          <el-option label="冻结" value="FROZEN" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标状态">
        <el-select
          v-model="form.toStatus"
          clearable
          placeholder="请选择目标状态"
        >
          <el-option label="可用" value="AVAILABLE" />
          <el-option label="已预占" value="RESERVED" />
          <el-option label="已拣货" value="PICKED" />
          <el-option label="在途" value="IN_TRANSIT" />
          <el-option label="质检" value="QC" />
          <el-option label="冻结" value="FROZEN" />
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

    <PureTableBar title="统一库存流水" :columns="columns" @refresh="loadList">
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

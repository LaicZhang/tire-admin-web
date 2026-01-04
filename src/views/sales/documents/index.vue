<script setup lang="ts">
import { onMounted, ref } from "vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRouter } from "vue-router";
import {
  getSalesOrderListApi,
  getSalesOutboundListApi,
  getSalesReturnOrderListApi,
  SALES_ORDER_TYPE,
  SALES_OUTBOUND_ORDER_TYPE,
  SALES_RETURN_ORDER_TYPE
} from "@/api/sales";
import {
  message,
  ALL_LIST,
  localForage,
  handleApiError,
  formatDate
} from "@/utils";
import { documentColumns } from "./columns";
import type { DocumentItem, DocumentQueryParams, DocumentType } from "./types";
import { DOCUMENT_TYPE_OPTIONS } from "./types";

defineOptions({
  name: "SalesDocuments"
});

const router = useRouter();

const dataList = ref<DocumentItem[]>([]);
const loading = ref(false);
const searchFormRef = ref<{ resetFields: () => void }>();

const searchForm = ref<DocumentQueryParams>({
  type: undefined,
  customerId: undefined,
  isApproved: undefined,
  status: undefined,
  startDate: undefined,
  endDate: undefined,
  keyword: undefined
});

const dateRange = ref<[string, string] | null>(null);

const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const customerList = ref<unknown[]>([]);

async function loadSelectData() {
  const customers = await localForage().getItem(ALL_LIST.customer);
  customerList.value = (customers as unknown[]) || [];
}

async function getList() {
  try {
    loading.value = true;

    const typeMap: Record<string, string> = {
      order: "sale-order",
      outbound: "sale-outbound",
      return: "return-order"
    };

    const typeNameMap: Record<string, string> = {
      "sale-order": "销售订单",
      "sale-outbound": "销售出库单",
      "return-order": "销售退货单"
    };

    const allData: DocumentItem[] = [];

    if (dateRange.value) {
      searchForm.value.startDate = dateRange.value[0];
      searchForm.value.endDate = dateRange.value[1];
    }

    const typesToQuery = searchForm.value.type
      ? [typeMap[searchForm.value.type]]
      : Object.values(typeMap);

    const fetchByType: Record<
      string,
      (index: number, params?: Record<string, unknown>) => Promise<unknown>
    > = {
      [SALES_ORDER_TYPE]: getSalesOrderListApi,
      [SALES_OUTBOUND_ORDER_TYPE]: getSalesOutboundListApi,
      [SALES_RETURN_ORDER_TYPE]: getSalesReturnOrderListApi
    };

    for (const orderType of typesToQuery) {
      try {
        const fetch = fetchByType[orderType];
        if (!fetch) continue;
        const res = await fetch(pagination.value.currentPage, searchForm.value);
        if (res.code === 200 && res.data.list) {
          let items = res.data.list;
          if (orderType === "return-order") {
            items = items.filter((item: unknown) => item.customerId);
          }
          const mappedItems = items.map((item: unknown) => ({
            ...item,
            type: Object.keys(typeMap).find(
              k => typeMap[k] === orderType
            ) as DocumentType,
            typeName: typeNameMap[orderType],
            customerName: item.customer?.name || "",
            operatorName: item.operator?.name || "",
            createdAt: formatDate(item.createdAt)
          }));
          allData.push(...mappedItems);
        }
      } catch {
        // Continue with other types
      }
    }

    dataList.value = allData.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
    pagination.value.total = allData.length;
  } catch (error) {
    handleApiError(error, "获取销售单据列表失败");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.value.currentPage = 1;
  getList();
}

function onReset(formEl: { resetFields: () => void } | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  dateRange.value = null;
  onSearch();
}

function handlePageChange(page: number) {
  pagination.value.currentPage = page;
  getList();
}

function viewDocument(row: DocumentItem) {
  const routeMap: Record<DocumentType, string> = {
    order: "/sales/order",
    outbound: "/sales/outbound",
    return: "/sales/return"
  };
  router.push({
    path: routeMap[row.type],
    query: { uid: row.uid, action: "view" }
  });
}

function editDocument(row: DocumentItem) {
  const routeMap: Record<DocumentType, string> = {
    order: "/sales/order",
    outbound: "/sales/outbound",
    return: "/sales/return"
  };
  router.push({
    path: routeMap[row.type],
    query: { uid: row.uid, action: "edit" }
  });
}

async function handleBatchApprove() {
  message("批量审核功能开发中", { type: "info" });
}

async function handleExport() {
  message("导出功能开发中", { type: "info" });
}

onMounted(async () => {
  await loadSelectData();
  getList();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      class="m-1"
      :form="searchForm"
      :loading="loading"
      @search="onSearch"
      @reset="onReset(searchFormRef)"
    >
      <el-form-item label="单据类型">
        <el-select
          v-model="searchForm.type"
          placeholder="请选择单据类型"
          clearable
          class="w-[150px]"
        >
          <el-option
            v-for="item in DOCUMENT_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="客户">
        <el-select
          v-model="searchForm.customerId"
          placeholder="请选择客户"
          clearable
          filterable
          class="w-[180px]"
        >
          <el-option
            v-for="item in customerList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select
          v-model="searchForm.isApproved"
          placeholder="请选择审核状态"
          clearable
          class="w-[120px]"
        >
          <el-option label="已审核" :value="true" />
          <el-option label="待审核" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="w-[240px]"
        />
      </el-form-item>
      <el-form-item label="关键词">
        <el-input
          v-model="searchForm.keyword"
          placeholder="单据编号/备注"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="销售单据汇总" @refresh="getList">
        <template #buttons>
          <el-button type="primary" @click="handleBatchApprove">
            批量审核
          </el-button>
          <el-button type="success" @click="handleExport"> 导出 </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns="documentColumns"
            border
            :data="dataList"
            :loading="loading"
            show-overflow-tooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
          >
            <template #operation="{ row }">
              <el-button link type="primary" @click="viewDocument(row)">
                查看
              </el-button>
              <el-button
                v-if="!row.isApproved"
                link
                type="primary"
                @click="editDocument(row)"
              >
                编辑
              </el-button>
              <el-button v-if="!row.isApproved" link type="success">
                审核
              </el-button>
              <el-button link type="info"> 打印 </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRouter } from "vue-router";
import {
  getPurchaseInboundListApi,
  getPurchaseOrderListApi,
  getPurchaseReturnOrderListApi,
  PURCHASE_INBOUND_ORDER_TYPE,
  PURCHASE_ORDER_TYPE,
  PURCHASE_RETURN_ORDER_TYPE
} from "@/api/purchase";
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
  name: "PurchaseDocuments"
});

const router = useRouter();

const dataList = ref<DocumentItem[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const searchForm = ref<DocumentQueryParams>({
  type: undefined,
  providerId: undefined,
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

const providerList = ref<unknown[]>([]);

async function loadSelectData() {
  try {
    const providers = await localForage().getItem(ALL_LIST.provider);
    providerList.value = (providers as unknown[]) || [];
  } catch (error) {
    handleApiError(error, "加载下拉数据失败");
  }
}

async function getList() {
  try {
    loading.value = true;

    const typeMap: Record<string, string> = {
      order: "purchase-order",
      inbound: "purchase-inbound",
      return: "return-order"
    };

    const typeNameMap: Record<string, string> = {
      "purchase-order": "采购订单",
      "purchase-inbound": "采购入库单",
      "return-order": "采购退货单"
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
      [PURCHASE_ORDER_TYPE]: getPurchaseOrderListApi,
      [PURCHASE_INBOUND_ORDER_TYPE]: getPurchaseInboundListApi,
      [PURCHASE_RETURN_ORDER_TYPE]: getPurchaseReturnOrderListApi
    };

    for (const orderType of typesToQuery) {
      try {
        const fetch = fetchByType[orderType];
        if (!fetch) continue;
        const res = await fetch(pagination.value.currentPage, searchForm.value);
        if (res.code === 200 && res.data.list) {
          let items = res.data.list;
          if (orderType === PURCHASE_RETURN_ORDER_TYPE) {
            items = items.filter((item: unknown) => item.providerId);
          }
          const mappedItems = items.map((item: unknown) => ({
            ...item,
            type: Object.keys(typeMap).find(
              k => typeMap[k] === orderType
            ) as DocumentType,
            typeName: typeNameMap[orderType],
            providerName: item.provider?.name || "",
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
    handleApiError(error, "获取采购单据列表失败");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.value.currentPage = 1;
  getList();
}

function onReset() {
  searchFormRef.value?.resetFields();
  dateRange.value = null;
  pagination.value.currentPage = 1;
  getList();
}

function handlePageChange(page: number) {
  pagination.value.currentPage = page;
  getList();
}

function viewDocument(row: DocumentItem) {
  const routeMap: Record<DocumentType, string> = {
    order: "/purchase/order",
    inbound: "/purchase/inbound",
    return: "/purchase/return"
  };
  router.push({
    path: routeMap[row.type],
    query: { uid: row.uid, action: "view" }
  });
}

function editDocument(row: DocumentItem) {
  const routeMap: Record<DocumentType, string> = {
    order: "/purchase/order",
    inbound: "/purchase/inbound",
    return: "/purchase/return"
  };
  router.push({
    path: routeMap[row.type],
    query: { uid: row.uid, action: "edit" }
  });
}

function auditDocument(row: DocumentItem) {
  const routeMap: Record<DocumentType, string> = {
    order: "/purchase/order",
    inbound: "/purchase/inbound",
    return: "/purchase/return"
  };
  router.push({
    path: routeMap[row.type],
    query: { uid: row.uid, action: "audit" }
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
      :form="searchForm"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
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
      <el-form-item label="供应商">
        <el-select
          v-model="searchForm.providerId"
          placeholder="请选择供应商"
          clearable
          filterable
          class="w-[180px]"
        >
          <el-option
            v-for="item in providerList"
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
      <PureTableBar title="采购单据汇总" @refresh="getList">
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
              <el-button
                v-if="!row.isApproved"
                link
                type="success"
                @click="auditDocument(row)"
              >
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

<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { onMounted, ref } from "vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRouter } from "vue-router";
import { message, ALL_LIST, localForage, handleApiError } from "@/utils";
import {
  approveDocumentCenterApi,
  exportDocumentCenterApi,
  getDocumentCenterListApi,
  getDocumentCenterPrintApi,
  type DocumentCenterType
} from "@/api/document-center";
import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";
import { documentColumns } from "./columns";
import type { DocumentItem, DocumentQueryParams, DocumentType } from "./types";
import { DOCUMENT_TYPE_OPTIONS } from "./types";

defineOptions({
  name: "SalesDocuments"
});

const router = useRouter();

const dataList = ref<DocumentItem[]>([]);
const selectedRows = ref<DocumentItem[]>([]);
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
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

interface SelectItem {
  uid: string;
  name: string;
}

const customerList = ref<SelectItem[]>([]);

const documentTypeMap: Record<DocumentType, DocumentCenterType> = {
  order: "SALE_ORDER",
  outbound: "SALE_OUTBOUND",
  return: "SALE_RETURN"
};

async function loadSelectData() {
  const customers = await localForage().getItem(ALL_LIST.customer);
  customerList.value = (customers as SelectItem[]) || [];
}

async function getList() {
  try {
    loading.value = true;

    if (dateRange.value) {
      searchForm.value.startDate = dateRange.value[0];
      searchForm.value.endDate = dateRange.value[1];
    }

    const targetName = customerList.value.find(
      item => item.uid === searchForm.value.customerId
    )?.name;

    const res = await getDocumentCenterListApi(pagination.value.currentPage, {
      pageSize: pagination.value.pageSize,
      documentType: searchForm.value.type
        ? documentTypeMap[searchForm.value.type]
        : undefined,
      status:
        searchForm.value.isApproved === undefined
          ? undefined
          : searchForm.value.isApproved
            ? "APPROVED"
            : "DRAFT",
      targetName,
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      keyword: searchForm.value.keyword
    });

    if (res.code !== 200) {
      message(res.msg || "获取销售单据列表失败", { type: "error" });
      dataList.value = [];
      pagination.value.total = 0;
      return;
    }

    dataList.value = (res.data?.list ?? [])
      .filter(item =>
        Object.values(documentTypeMap).includes(item.documentType)
      )
      .map(item => ({
        id: item.id,
        uid: item.uid,
        number: item.billNo,
        type:
          item.documentType === "SALE_ORDER"
            ? "order"
            : item.documentType === "SALE_OUTBOUND"
              ? "outbound"
              : "return",
        typeName: item.documentTypeLabel,
        customerName: item.targetName,
        count: item.count ?? 0,
        total: Number(item.amount ?? 0),
        status: item.status === "APPROVED",
        isApproved: item.status === "APPROVED",
        createdAt: item.createdAt,
        operatorName: item.operatorName,
        desc: item.remark
      }));
    pagination.value.total = res.data?.total ?? dataList.value.length;
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
    outbound: "/sales/order",
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
    outbound: "/sales/order",
    return: "/sales/return"
  };
  router.push({
    path: routeMap[row.type],
    query: { uid: row.uid, action: "edit" }
  });
}

function handleSelectionChange(rows: DocumentItem[]) {
  selectedRows.value = rows;
}

async function handleApproveRows(rows: DocumentItem[]) {
  const items = rows
    .filter(row => !row.isApproved)
    .map(row => ({
      documentType: documentTypeMap[row.type],
      uid: row.uid
    }));
  if (items.length === 0) {
    message("请选择待审核单据", { type: "warning" });
    return;
  }
  try {
    const { code, data, msg } = await approveDocumentCenterApi(items);
    if (code !== 200) {
      message(msg || "批量审核失败", { type: "error" });
      return;
    }
    const failed = (data ?? []).filter(item => !item.success);
    if (failed.length > 0) {
      message(`审核完成，失败 ${failed.length} 条`, { type: "warning" });
    } else {
      message("审核成功", { type: "success" });
    }
    selectedRows.value = [];
    getList();
  } catch {
    message("批量审核失败", { type: "error" });
  }
}

function handleBatchApprove() {
  handleApproveRows(selectedRows.value);
}

async function handleExport() {
  try {
    const blob = await exportDocumentCenterApi({
      documentType: searchForm.value.type
        ? documentTypeMap[searchForm.value.type]
        : undefined,
      status:
        searchForm.value.isApproved === undefined
          ? undefined
          : searchForm.value.isApproved
            ? "APPROVED"
            : "DRAFT",
      targetName: customerList.value.find(
        item => item.uid === searchForm.value.customerId
      )?.name,
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      keyword: searchForm.value.keyword
    });
    downloadBlob(
      blob,
      generateFilenameWithTimestamp("sales-document-center", "xlsx"),
      { showMessage: true }
    );
  } catch {
    message("导出失败", { type: "error" });
  }
}

async function handlePrint(row: DocumentItem) {
  try {
    const { code, data, msg } = await getDocumentCenterPrintApi(
      documentTypeMap[row.type],
      row.uid
    );
    if (code !== 200 || !data) {
      message(msg || "获取打印数据失败", { type: "error" });
      return;
    }
    const popup = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=960,height=720"
    );
    if (!popup) {
      message("打印窗口打开失败", { type: "warning" });
      return;
    }
    const rows = Object.entries(data.detail)
      .map(
        ([key, value]) =>
          `<tr><td style="padding:8px;border:1px solid #ddd;">${key}</td><td style="padding:8px;border:1px solid #ddd;">${value}</td></tr>`
      )
      .join("");
    popup.document.write(
      `<!doctype html><html><head><title>${data.billNo}</title></head><body style="font-family:sans-serif;padding:24px;"><h2>${data.billNo}</h2><p>状态：${data.status}</p><p>客户：${data.targetName ?? "-"}</p><table style="border-collapse:collapse;width:100%;margin-top:16px;">${rows}</table></body></html>`
    );
    popup.document.close();
    popup.focus();
    popup.print();
  } catch {
    message("获取打印数据失败", { type: "error" });
  }
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
            @selection-change="handleSelectionChange"
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
                @click="handleApproveRows([row])"
              >
                审核
              </el-button>
              <el-button link type="info" @click="handlePrint(row)">
                打印
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

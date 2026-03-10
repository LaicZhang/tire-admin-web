<script setup lang="ts">
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { ref, reactive, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import StatusTag from "@/components/StatusTag/index.vue";
import Delete from "~icons/ep/delete";
import Printer from "~icons/ep/printer";
import Download from "~icons/ep/download";
import Upload from "~icons/ep/upload";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { http } from "@/utils/http";
import { handleApiError, message } from "@/utils";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import {
  approveDocumentCenterApi,
  exportDocumentCenterApi,
  getDocumentCenterListApi,
  getDocumentCenterPrintApi,
  type DocumentCenterType
} from "@/api/document-center";
import MoneyDisplay from "@/components/MoneyDisplay/index.vue";
import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";
import {
  type FundDocument,
  type FundDocumentQueryParams,
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_STATUS_OPTIONS,
  DIRECTION_OPTIONS
} from "./types";
import { columns, getDocumentTypeInfo } from "./columns";
import { useCrud } from "@/composables";
import { useOptions } from "@/composables/useOptions";

defineOptions({
  name: "FundDocuments"
});

const router = useRouter();
const { confirm } = useConfirmDialog();
const selectedRows = ref<FundDocument[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const { customers, providers } = useOptions();

const targetNameOptions = computed(() => {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of [...customers.value, ...providers.value]) {
    const name = String(item.name || "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
});

const queryForm = reactive<FundDocumentQueryParams>({
  documentType: undefined,
  targetName: undefined,
  status: undefined,
  direction: undefined,
  startDate: undefined,
  endDate: undefined,
  billNo: undefined
});

type DocumentStatusTagType = (typeof DOCUMENT_STATUS_OPTIONS)[number]["type"];

const documentStatusMap = DOCUMENT_STATUS_OPTIONS.reduce(
  (acc, item) => {
    acc[item.value] = { label: item.label, type: item.type };
    return acc;
  },
  {} as Record<string, { label: string; type: DocumentStatusTagType }>
);

// 统计数据
const statistics = reactive({
  totalIncome: 0,
  totalExpense: 0,
  netAmount: 0
});

const approvableDocumentTypes = new Set<DocumentCenterType>([
  "WRITE_OFF",
  "PAYMENT",
  "TRANSFER",
  "OTHER_INCOME",
  "OTHER_EXPENSE"
]);

function resolveDirection(
  documentType: FundDocument["documentType"]
): FundDocument["direction"] {
  if (documentType === "RECEIPT" || documentType === "OTHER_INCOME")
    return "IN";
  if (documentType === "TRANSFER") return "TRANSFER";
  return "OUT";
}

function openPrintPreview(data: {
  billNo: string;
  documentType: string;
  status: string;
  targetName?: string;
  detail: Record<string, string>;
}) {
  const popup = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=960,height=720"
  );
  if (!popup) {
    message("打印窗口打开失败，请检查浏览器弹窗设置", { type: "warning" });
    return;
  }
  const rows = Object.entries(data.detail)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:8px;border:1px solid #ddd;">${key}</td><td style="padding:8px;border:1px solid #ddd;">${value}</td></tr>`
    )
    .join("");
  popup.document.write(`<!doctype html>
<html>
  <head><title>${data.billNo}</title></head>
  <body style="font-family: sans-serif; padding: 24px;">
    <h2>${data.documentType} - ${data.billNo}</h2>
    <p>状态：${data.status}</p>
    <p>往来单位：${data.targetName ?? "-"}</p>
    <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">${rows}</table>
  </body>
</html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

const buildParams = () => {
  const params: Record<string, unknown> = { ...queryForm };
  if (params.billNo) {
    params.keyword = params.billNo;
  }
  delete params.billNo;
  delete params.direction;
  Object.keys(params).forEach(key => {
    if (params[key] === "" || params[key] === undefined) {
      delete params[key];
    }
  });
  return params;
};

const {
  loading,
  dataList,
  pagination,
  fetchData: onSearch,
  onCurrentChange,
  onSizeChange
} = useCrud<
  FundDocument,
  CommonResult<
    PaginatedResponseDto<import("@/api/document-center").DocumentCenterItem>
  >,
  { page: number; pageSize: number }
>({
  api: async ({ page, pageSize }) =>
    getDocumentCenterListApi(page, {
      ...(buildParams() as Record<string, string | number | undefined>),
      pageSize
    }) as Promise<
      CommonResult<
        PaginatedResponseDto<import("@/api/document-center").DocumentCenterItem>
      >
    >,
  pagination: {
    total: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    currentPage: 1,
    background: true
  },
  transform: res => {
    if (res.code !== 200) {
      return { list: [], total: 0 };
    }
    let list = (res.data?.list ?? []).map(item => {
      const documentType = item.documentType as FundDocument["documentType"];
      return {
        id: item.id,
        uid: item.uid,
        billNo: item.billNo,
        documentType,
        targetName: item.targetName,
        amount: Number(item.amount ?? 0),
        direction: resolveDirection(documentType),
        status: item.status as FundDocument["status"],
        remark: item.remark,
        operatorName: item.operatorName,
        createdAt: item.createdAt
      };
    });
    if (queryForm.direction) {
      list = list.filter(item => item.direction === queryForm.direction);
    }
    return {
      list,
      total: res.data?.total ?? res.data?.count ?? list.length
    };
  },
  immediate: true
});

// 当数据列表变化时，重新计算统计
watch(dataList, newList => {
  let income = 0;
  let expense = 0;
  newList.forEach(doc => {
    if (doc.direction === "IN") {
      income += doc.amount || 0;
    } else if (doc.direction === "OUT") {
      expense += doc.amount || 0;
    }
  });
  statistics.totalIncome = income;
  statistics.totalExpense = expense;
  statistics.netAmount = income - expense;
});

function resetForm(formEl?: { resetFields: () => void }) {
  if (!formEl) return;
  formEl.resetFields();
  Object.assign(queryForm, {
    documentType: undefined,
    targetName: "",
    status: undefined,
    direction: undefined,
    startDate: "",
    endDate: "",
    billNo: ""
  });
  pagination.value = { ...pagination.value, currentPage: 1 };
  onSearch();
}

function handleSearch() {
  pagination.value = { ...pagination.value, currentPage: 1 };
  onSearch();
}

function handleView(row: FundDocument) {
  // 根据单据类型跳转到对应页面
  const typeRouteMap: Record<string, string> = {
    RECEIPT: "/fund/receipt",
    PAYMENT: "/fund/payment",
    WRITE_OFF: "/fund/writeOff",
    OTHER_INCOME: "/fund/otherIncome",
    OTHER_EXPENSE: "/fund/otherExpense",
    TRANSFER: "/fund/transfer"
  };
  const route = typeRouteMap[row.documentType];
  if (route) {
    router.push({ path: route, query: { uid: row.uid } });
  }
}

async function handleDelete(row: FundDocument) {
  const ok = await confirm(`确定删除单据 ${row.billNo} 吗？`, "删除确认", {
    type: "warning"
  });
  if (!ok) return;

  try {
    // 根据类型调用不同的删除接口
    await http.delete(`/fund/documents/${row.documentType}/${row.uid}`);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "删除失败");
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    message("请选择要删除的记录", { type: "warning" });
    return;
  }
  const ok = await confirm(
    `确定删除选中的 ${selectedRows.value.length} 条记录吗？`,
    "批量删除确认",
    { type: "warning" }
  );
  if (!ok) return;

  try {
    for (const row of selectedRows.value) {
      await http.delete(`/fund/documents/${row.documentType}/${row.uid}`);
    }
    message("批量删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "批量删除失败");
  }
}

function handlePrint() {
  if (selectedRows.value.length === 0) {
    message("请选择要打印的记录", { type: "warning" });
    return;
  }
  Promise.all(
    selectedRows.value.map(row =>
      getDocumentCenterPrintApi(row.documentType, row.uid)
    )
  )
    .then(results => {
      results.forEach(result => {
        if (result.code === 200 && result.data) {
          openPrintPreview(result.data);
        }
      });
    })
    .catch(() => {
      message("获取打印数据失败", { type: "error" });
    });
}

function handleExport() {
  exportDocumentCenterApi(buildParams())
    .then(blob => {
      downloadBlob(
        blob,
        generateFilenameWithTimestamp("fund-document-center", "xlsx"),
        { showMessage: true }
      );
    })
    .catch(() => {
      message("导出失败", { type: "error" });
    });
}

function handleImport() {
  message("导入功能开发中");
}

function handleSelectionChange(rows: FundDocument[]) {
  selectedRows.value = rows;
}

async function handleBatchApprove() {
  const items = selectedRows.value.filter(row =>
    approvableDocumentTypes.has(row.documentType)
  );
  if (items.length === 0) {
    message("所选单据不支持批量审核", { type: "warning" });
    return;
  }
  try {
    const { data, code, msg } = await approveDocumentCenterApi(
      items.map(row => ({
        documentType: row.documentType,
        uid: row.uid
      }))
    );
    if (code !== 200) {
      message(msg || "批量审核失败", { type: "error" });
      return;
    }
    const failed = (data ?? []).filter(item => !item.success);
    if (failed.length > 0) {
      message(`批量审核完成，失败 ${failed.length} 条`, { type: "warning" });
    } else {
      message("批量审核成功", { type: "success" });
    }
    onSearch();
  } catch (e) {
    handleApiError(e, "批量审核失败");
  }
}
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="formRef"
      :form="queryForm"
      :loading="loading"
      @search="onSearch"
      @reset="resetForm(formRef)"
    >
      <el-form-item label="单据编号" prop="billNo">
        <el-input
          v-model="queryForm.billNo"
          placeholder="请输入单据编号"
          clearable
          class="w-[160px]"
        />
      </el-form-item>
      <el-form-item label="单据类型" prop="documentType">
        <el-select
          v-model="queryForm.documentType"
          placeholder="请选择类型"
          clearable
          class="!w-[130px]"
        >
          <el-option
            v-for="item in DOCUMENT_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="收支方向" prop="direction">
        <el-select
          v-model="queryForm.direction"
          placeholder="请选择"
          clearable
          class="!w-[100px]"
        >
          <el-option
            v-for="item in DIRECTION_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="往来单位" prop="targetName">
        <el-select
          v-model="queryForm.targetName"
          placeholder="请选择或输入名称"
          filterable
          clearable
          allow-create
          default-first-option
          class="!w-[140px]"
        >
          <el-option
            v-for="name in targetNameOptions"
            :key="name"
            :label="name"
            :value="name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryForm.status"
          placeholder="请选择"
          clearable
          class="!w-[100px]"
        >
          <el-option
            v-for="item in DOCUMENT_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围" prop="dateRange">
        <el-date-picker
          v-model="queryForm.startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
          class="!w-[140px]"
        />
        <span class="mx-2">-</span>
        <el-date-picker
          v-model="queryForm.endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="!w-[140px]"
        />
      </el-form-item>
    </ReSearchForm>

    <!-- 统计卡片 -->
    <div class="statistics-cards mb-4 flex gap-4 px-4">
      <el-card shadow="never" class="flex-1">
        <div class="text-gray-500 text-sm">收入合计</div>
        <div class="text-xl font-bold text-green-600">
          <MoneyDisplay :value="statistics.totalIncome" unit="fen" />
        </div>
      </el-card>
      <el-card shadow="never" class="flex-1">
        <div class="text-gray-500 text-sm">支出合计</div>
        <div class="text-xl font-bold text-red-500">
          <MoneyDisplay :value="statistics.totalExpense" unit="fen" />
        </div>
      </el-card>
      <el-card shadow="never" class="flex-1">
        <div class="text-gray-500 text-sm">净额</div>
        <div
          class="text-xl font-bold"
          :class="statistics.netAmount >= 0 ? 'text-green-600' : 'text-red-500'"
        >
          <MoneyDisplay :value="statistics.netAmount" unit="fen" />
        </div>
      </el-card>
    </div>

    <PureTableBar title="资金单据汇总" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="danger"
          :icon="useRenderIcon(Delete)"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button :icon="useRenderIcon(Upload)" @click="handleImport">
          导入
        </el-button>
        <el-button :icon="useRenderIcon(Download)" @click="handleExport">
          导出
        </el-button>
        <el-button :icon="useRenderIcon(Printer)" @click="handlePrint">
          打印
        </el-button>
        <el-button
          type="primary"
          :disabled="selectedRows.length === 0"
          @click="handleBatchApprove"
        >
          批量审核
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
          @selection-change="handleSelectionChange"
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
        >
          <template #documentType="{ row }">
            <el-tag
              :type="getDocumentTypeInfo(row.documentType).color"
              size="small"
            >
              {{ getDocumentTypeInfo(row.documentType).label }}
            </el-tag>
          </template>
          <template #direction="{ row }">
            <el-tag
              :type="
                row.direction === 'IN'
                  ? 'success'
                  : row.direction === 'OUT'
                    ? 'danger'
                    : 'info'
              "
              size="small"
            >
              {{
                row.direction === "IN"
                  ? "收入"
                  : row.direction === "OUT"
                    ? "支出"
                    : "转账"
              }}
            </el-tag>
          </template>
          <template #amount="{ row }">
            <span
              :class="
                row.direction === 'IN'
                  ? 'text-green-600'
                  : row.direction === 'OUT'
                    ? 'text-red-500'
                    : ''
              "
              class="font-medium"
            >
              {{
                row.direction === "IN"
                  ? "+"
                  : row.direction === "OUT"
                    ? "-"
                    : ""
              }}
              <MoneyDisplay
                :value="row.amount"
                unit="fen"
                :show-symbol="false"
              />
            </span>
          </template>
          <template #status="{ row }">
            <StatusTag :status="row.status" :status-map="documentStatusMap" />
          </template>
          <template #operation="{ row, size }">
            <el-button
              link
              type="primary"
              :size="size"
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status === 'DRAFT'"
              link
              type="danger"
              :size="size"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.statistics-cards {
  :deep(.el-card__body) {
    padding: 16px;
  }
}
</style>

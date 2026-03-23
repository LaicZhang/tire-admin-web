<script setup lang="ts">
import { PAGE_SIZE_MEDIUM } from "@/utils/constants";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import Download from "~icons/ep/download";
import Printer from "~icons/ep/printer";
import Select from "~icons/ep/select";
import RefreshLeft from "~icons/ep/refresh-left";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { columns } from "./columns";
import {
  approveDocumentCenterApi,
  exportDocumentCenterApi,
  getDocumentCenterListApi,
  getDocumentCenterPrintApi,
  reverseAuditDocumentCenterApi,
  type DocumentCenterType
} from "@/api/document-center";
import { deleteOrderApi } from "@/api";
import { deleteInventoryCheckTaskApi } from "@/api/business/inventory-check";
import { deleteAssemblyOrderApi } from "@/api/business/assembly";
import { deleteCostAdjustOrder } from "@/api/business/costAdjust";
import {
  deleteDisassemblyOrderApi,
  deleteOtherInboundOrderApi,
  deleteOtherOutboundOrderApi
} from "@/api/inventory";
import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";
import { handleApiError, message } from "@/utils";
import {
  approvableDocumentTypes,
  documentStatusMap,
  documentStatusOptions,
  documentTypeMap,
  documentTypeOptions,
  reversibleDocumentTypes,
  reverseReasonRequiredTypes,
  type DocumentQuery,
  type InventoryDocument,
  type InventoryDocumentType
} from "./types";

defineOptions({
  name: "InventoryDocuments"
});

const router = useRouter();
const { confirm } = useConfirmDialog();
const loading = ref(false);
const dataList = ref<InventoryDocument[]>([]);
const selectedRows = ref<InventoryDocument[]>([]);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const queryParams = reactive<DocumentQuery>({
  documentType: undefined,
  status: undefined,
  startDate: undefined,
  endDate: undefined,
  keyword: undefined
});

const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_MEDIUM,
  currentPage: 1,
  background: true
});

const typeRouteMap: Record<InventoryDocumentType, string> = {
  INVENTORY_TRANSFER: "/inventory/transfer",
  STOCKTAKING: "/inventory/stocktaking",
  OTHER_INBOUND: "/inventory/otherInbound",
  OTHER_OUTBOUND: "/inventory/otherOutbound",
  ASSEMBLY: "/inventory/assembly",
  DISASSEMBLY: "/inventory/disassembly",
  COST_ADJUST: "/inventory/costAdjust"
};

const hasSelection = computed(() => selectedRows.value.length > 0);
const hasDocumentType = (
  row: InventoryDocument
): row is InventoryDocument & { documentType: InventoryDocumentType } =>
  Boolean(row.documentType);

const getTypeColor = (
  row: InventoryDocument
): "primary" | "success" | "warning" | "danger" | "info" =>
  row.documentType
    ? documentTypeMap[row.documentType]?.color || "info"
    : "info";

const getTypeLabel = (row: InventoryDocument) =>
  row.documentType
    ? documentTypeMap[row.documentType]?.label || row.documentType
    : "-";

const buildParams = () => ({
  documentType: queryParams.documentType || undefined,
  status: queryParams.status || undefined,
  keyword: queryParams.keyword || undefined,
  startDate: queryParams.startDate || undefined,
  endDate: queryParams.endDate || undefined,
  pageSize: pagination.value.pageSize
});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getDocumentCenterListApi(
      pagination.value.currentPage,
      buildParams()
    );
    if (res.code !== 200) {
      message(res.msg || "获取库存单据列表失败", { type: "error" });
      return;
    }
    dataList.value = (res.data?.list ?? []).map(item => ({
      id: item.id,
      uid: item.uid,
      billNo: item.billNo,
      documentType: item.documentType as InventoryDocumentType,
      targetName: item.targetName,
      amount:
        item.amount === undefined || item.amount === ""
          ? undefined
          : Number(item.amount),
      count: item.count,
      status: item.status,
      operatorName: item.operatorName,
      remark: item.remark,
      createdAt: item.createdAt
    }));
    pagination.value.total = res.data?.total ?? dataList.value.length;
  } catch (error) {
    handleApiError(error, "获取库存单据列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

const handleReset = () => {
  searchFormRef.value?.resetFields();
  queryParams.documentType = undefined;
  queryParams.status = undefined;
  queryParams.startDate = undefined;
  queryParams.endDate = undefined;
  queryParams.keyword = undefined;
  handleSearch();
};

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchData();
};

const handleSelectionChange = (rows: InventoryDocument[]) => {
  selectedRows.value = rows;
};

const handleView = (row: InventoryDocument) => {
  if (!hasDocumentType(row)) return;
  router.push({
    path: typeRouteMap[row.documentType],
    query: { uid: row.uid }
  });
};

const openPrintPreview = (data: {
  billNo: string;
  documentType: string;
  status: string;
  targetName?: string;
  detail: Record<string, string>;
}) => {
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
    <p>仓库/对象：${data.targetName ?? "-"}</p>
    <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">${rows}</table>
  </body>
</html>`);
  popup.document.close();
  popup.focus();
  popup.print();
};

const deleteByType = async (row: InventoryDocument) => {
  switch (row.documentType) {
    case "INVENTORY_TRANSFER":
      await deleteOrderApi("transfer-order", row.uid);
      return;
    case "STOCKTAKING":
      await deleteInventoryCheckTaskApi(row.id);
      return;
    case "OTHER_INBOUND":
      await deleteOtherInboundOrderApi(row.uid);
      return;
    case "OTHER_OUTBOUND":
      await deleteOtherOutboundOrderApi(row.uid);
      return;
    case "ASSEMBLY":
      await deleteAssemblyOrderApi(row.uid);
      return;
    case "DISASSEMBLY":
      await deleteDisassemblyOrderApi(row.uid);
      return;
    case "COST_ADJUST":
      await deleteCostAdjustOrder(row.id);
      return;
  }
};

const handleDelete = async (row: InventoryDocument) => {
  if (row.status === "APPROVED") {
    message("已审核的单据需要先反审核后才能删除", { type: "warning" });
    return;
  }
  const ok = await confirm(`确认删除单据 ${row.billNo} 吗？`, "删除确认", {
    type: "warning"
  });
  if (!ok) return;

  try {
    await deleteByType(row);
    message("删除成功", { type: "success" });
    fetchData();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
};

const handleBatchDelete = async () => {
  if (!hasSelection.value) {
    message("请先选择要删除的单据", { type: "warning" });
    return;
  }
  if (selectedRows.value.some(row => row.status === "APPROVED")) {
    message("已审核的单据需要先反审核后才能删除", { type: "warning" });
    return;
  }
  const ok = await confirm(
    `确认删除选中的 ${selectedRows.value.length} 条单据吗？`,
    "批量删除",
    { type: "warning" }
  );
  if (!ok) return;

  try {
    await Promise.all(selectedRows.value.map(deleteByType));
    message("批量删除成功", { type: "success" });
    selectedRows.value = [];
    fetchData();
  } catch (error) {
    handleApiError(error, "批量删除失败");
  }
};

const handleExport = async () => {
  try {
    const blob = await exportDocumentCenterApi(buildParams());
    downloadBlob(
      blob,
      generateFilenameWithTimestamp("inventory-document-center", "xlsx"),
      { showMessage: true }
    );
  } catch (error) {
    handleApiError(error, "导出失败");
  }
};

const handlePrint = async () => {
  if (!hasSelection.value) {
    message("请先选择要打印的单据", { type: "warning" });
    return;
  }
  try {
    const results = await Promise.all(
      selectedRows.value.map(row =>
        getDocumentCenterPrintApi(
          (row.documentType || "STOCKTAKING") as DocumentCenterType,
          row.uid
        )
      )
    );
    results.forEach(result => {
      if (result.code === 200 && result.data) {
        openPrintPreview(result.data);
      }
    });
  } catch (error) {
    handleApiError(error, "获取打印数据失败");
  }
};

const handleBatchApprove = async () => {
  const items = selectedRows.value.filter(
    row =>
      hasDocumentType(row) &&
      approvableDocumentTypes.has(row.documentType) &&
      row.status !== "APPROVED" &&
      row.status !== "VOID"
  );
  if (items.length === 0) {
    message("所选单据不支持批量审核", { type: "warning" });
    return;
  }
  try {
    const res = await approveDocumentCenterApi(
      items.map(row => ({
        documentType: row.documentType as DocumentCenterType,
        uid: row.uid
      }))
    );
    const failed = (res.data ?? []).filter(item => !item.success);
    message(
      failed.length > 0
        ? `批量审核完成，失败 ${failed.length} 条`
        : "批量审核成功",
      { type: failed.length > 0 ? "warning" : "success" }
    );
    fetchData();
  } catch (error) {
    handleApiError(error, "批量审核失败");
  }
};

const requestReverseReason = async (items: InventoryDocument[]) => {
  const requiresReason = items.some(
    row =>
      hasDocumentType(row) && reverseReasonRequiredTypes.has(row.documentType)
  );
  if (!requiresReason) return undefined;
  const res = await ElMessageBox.prompt("请输入反审核原因", "反审核", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /.+/,
    inputErrorMessage: "请输入反审核原因"
  });
  if (typeof res === "string") return undefined;
  return (res as { value: string }).value;
};

const handleBatchReverseAudit = async () => {
  const items = selectedRows.value.filter(
    row =>
      hasDocumentType(row) &&
      reversibleDocumentTypes.has(row.documentType) &&
      row.status === "APPROVED"
  );
  if (items.length === 0) {
    message("所选单据不支持批量反审核", { type: "warning" });
    return;
  }
  try {
    const reason = await requestReverseReason(items);
    const res = await reverseAuditDocumentCenterApi(
      items.map(row => ({
        documentType: row.documentType as DocumentCenterType,
        uid: row.uid
      })),
      reason
    );
    const failed = (res.data ?? []).filter(item => !item.success);
    message(
      failed.length > 0
        ? `批量反审核完成，失败 ${failed.length} 条`
        : "批量反审核成功",
      { type: failed.length > 0 ? "warning" : "success" }
    );
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error, "批量反审核失败");
    }
  }
};

const handleApprove = async (row: InventoryDocument) => {
  try {
    await approveDocumentCenterApi([
      {
        documentType: (row.documentType || "STOCKTAKING") as DocumentCenterType,
        uid: row.uid
      }
    ]);
    message("审核成功", { type: "success" });
    fetchData();
  } catch (error) {
    handleApiError(error, "审核失败");
  }
};

const handleReverseAudit = async (row: InventoryDocument) => {
  try {
    const reason = await requestReverseReason([row]);
    await reverseAuditDocumentCenterApi(
      [
        {
          documentType: (row.documentType ||
            "STOCKTAKING") as DocumentCenterType,
          uid: row.uid
        }
      ],
      reason
    );
    message("反审核成功", { type: "success" });
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error, "反审核失败");
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="queryParams"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <el-form-item label="单据类型" prop="documentType">
        <el-select
          v-model="queryParams.documentType"
          placeholder="请选择类型"
          clearable
          class="w-[140px]"
        >
          <el-option
            v-for="item in documentTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          class="w-[130px]"
        >
          <el-option
            v-for="item in documentStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="queryParams.startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
          class="w-[140px]"
        />
        <span class="mx-2">-</span>
        <el-date-picker
          v-model="queryParams.endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="w-[140px]"
        />
      </el-form-item>
      <el-form-item label="关键字" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="单据编号/备注"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card>
      <PureTableBar
        title="库存单据列表"
        :columns="columns"
        @refresh="fetchData"
      >
        <template #buttons>
          <el-button
            type="primary"
            :disabled="!hasSelection"
            :icon="useRenderIcon(Select)"
            @click="handleBatchApprove"
          >
            批量审核
          </el-button>
          <el-button
            :disabled="!hasSelection"
            :icon="useRenderIcon(RefreshLeft)"
            @click="handleBatchReverseAudit"
          >
            批量反审核
          </el-button>
          <el-button :icon="useRenderIcon(Download)" @click="handleExport">
            导出
          </el-button>
          <el-button
            :disabled="!hasSelection"
            :icon="useRenderIcon(Printer)"
            @click="handlePrint"
          >
            打印
          </el-button>
          <el-button
            type="danger"
            :disabled="!hasSelection"
            :icon="useRenderIcon(Delete)"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            row-key="id"
            adaptive
            border
            :size="size"
            :columns="dynamicColumns"
            :data="dataList"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
            @selection-change="handleSelectionChange"
          >
            <template #documentType="{ row }">
              <el-tag :type="getTypeColor(row)" size="small">
                {{ getTypeLabel(row) }}
              </el-tag>
            </template>
            <template #amount="{ row }">
              <span>{{ row.amount === undefined ? "-" : row.amount }}</span>
            </template>
            <template #status="{ row }">
              <el-tag
                :type="documentStatusMap[row.status]?.type || 'info'"
                size="small"
              >
                {{ documentStatusMap[row.status]?.label || row.status }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-button
                link
                type="primary"
                :icon="useRenderIcon(View)"
                @click="handleView(row)"
              >
                查看
              </el-button>
              <el-button
                v-if="
                  approvableDocumentTypes.has(row.documentType) &&
                  row.status !== 'APPROVED' &&
                  row.status !== 'VOID'
                "
                link
                type="success"
                @click="handleApprove(row)"
              >
                审核
              </el-button>
              <el-button
                v-if="
                  reversibleDocumentTypes.has(row.documentType) &&
                  row.status === 'APPROVED'
                "
                link
                type="warning"
                @click="handleReverseAudit(row)"
              >
                反审核
              </el-button>
              <el-button
                v-if="row.status !== 'APPROVED'"
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}
</style>

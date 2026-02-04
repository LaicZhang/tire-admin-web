<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import Download from "~icons/ep/download";
import Printer from "~icons/ep/printer";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { columns } from "./columns";
import {
  type InventoryDocument,
  type DocumentQuery,
  DocumentType,
  documentTypeMap,
  documentStatusMap
} from "./types";
import { useRouter } from "vue-router";
import { deleteOrderApi } from "@/api";
import { deleteInventoryCheckTaskApi } from "@/api/business/inventory-check";
import { deleteAssemblyOrderApi } from "@/api/business/assembly";
import { deleteCostAdjustOrder } from "@/api/business/costAdjust";
import {
  getInventoryDocumentListApi,
  deleteDisassemblyOrderApi,
  deleteOtherInboundOrderApi,
  deleteOtherOutboundOrderApi
} from "@/api/inventory";
import { logger } from "@/utils/logger";
import { handleApiError } from "@/utils";

defineOptions({
  name: "InventoryDocuments"
});

const router = useRouter();
const dataList = ref<InventoryDocument[]>([]);
const loading = ref(false);
const { confirm } = useConfirmDialog();
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const selectedRows = ref<InventoryDocument[]>([]);

const queryParams = reactive<DocumentQuery>({
  type: undefined,
  status: undefined,
  startDate: "",
  endDate: "",
  keyword: ""
});

const dateRange = ref<[string, string] | null>(null);

const pagination = ref({
  total: 0,
  pageSize: 15,
  currentPage: 1,
  background: true
});

const typeOptions = Object.entries(documentTypeMap).map(([value, config]) => ({
  value,
  label: config.label
}));

const statusOptions = Object.entries(documentStatusMap).map(
  ([value, config]) => ({
    value,
    label: config.label
  })
);

const fetchData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getInventoryDocumentListApi(
      pagination.value.currentPage,
      {
        ...queryParams,
        type: queryParams.type || undefined,
        status: queryParams.status || undefined,
        startDate: dateRange.value?.[0] || undefined,
        endDate: dateRange.value?.[1] || undefined
      }
    );
    if (code === 200) {
      dataList.value = data.list;
      pagination.value.total = data.count;
    }
  } catch (error) {
    logger.error("获取库存单据列表失败", error);
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
  queryParams.type = undefined;
  queryParams.status = undefined;
  queryParams.keyword = "";
  dateRange.value = null;
  handleSearch();
};

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchData();
};

const handleSelectionChange = (rows: InventoryDocument[]) => {
  selectedRows.value = rows;
};

const getDocumentRoute = (type: DocumentType): string => {
  const routeMap: Record<DocumentType, string> = {
    [DocumentType.TRANSFER]: "/inventory/transfer",
    [DocumentType.STOCKTAKING]: "/inventory/stocktaking",
    [DocumentType.OTHER_INBOUND]: "/inventory/otherInbound",
    [DocumentType.OTHER_OUTBOUND]: "/inventory/otherOutbound",
    [DocumentType.ASSEMBLY]: "/inventory/assembly",
    [DocumentType.DISASSEMBLY]: "/inventory/disassembly",
    [DocumentType.COST_ADJUST]: "/inventory/costAdjust"
  };
  return routeMap[type] || "/inventory/documents";
};

const handleView = (row: InventoryDocument) => {
  router.push({
    path: getDocumentRoute(row.type),
    query: { uid: row.uid }
  });
};

const handleDelete = async (row: InventoryDocument) => {
  if (row.isApproved) {
    ElMessage.warning("已审核的单据需要先反审核后才能删除");
    return;
  }
  const ok = await confirm("确认删除该单据?", "确认删除", {
    type: "warning"
  });
  if (!ok) return;

  try {
    switch (row.type) {
      case DocumentType.TRANSFER:
        await deleteOrderApi("transfer-order", row.uid);
        break;
      case DocumentType.STOCKTAKING:
        await deleteInventoryCheckTaskApi(row.id);
        break;
      case DocumentType.OTHER_INBOUND:
        await deleteOtherInboundOrderApi(row.uid);
        break;
      case DocumentType.OTHER_OUTBOUND:
        await deleteOtherOutboundOrderApi(row.uid);
        break;
      case DocumentType.ASSEMBLY:
        await deleteAssemblyOrderApi(row.uid);
        break;
      case DocumentType.DISASSEMBLY:
        await deleteDisassemblyOrderApi(row.uid);
        break;
      case DocumentType.COST_ADJUST:
        await deleteCostAdjustOrder(row.id);
        break;
      default:
        throw new Error(`未知单据类型: ${String(row.type)}`);
    }
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
};

const deleteByType = async (row: InventoryDocument): Promise<void> => {
  switch (row.type) {
    case DocumentType.TRANSFER:
      await deleteOrderApi("transfer-order", row.uid);
      break;
    case DocumentType.STOCKTAKING:
      await deleteInventoryCheckTaskApi(row.id);
      break;
    case DocumentType.OTHER_INBOUND:
      await deleteOtherInboundOrderApi(row.uid);
      break;
    case DocumentType.OTHER_OUTBOUND:
      await deleteOtherOutboundOrderApi(row.uid);
      break;
    case DocumentType.ASSEMBLY:
      await deleteAssemblyOrderApi(row.uid);
      break;
    case DocumentType.DISASSEMBLY:
      await deleteDisassemblyOrderApi(row.uid);
      break;
    case DocumentType.COST_ADJUST:
      await deleteCostAdjustOrder(row.id);
      break;
    default:
      throw new Error(`未知单据类型: ${String(row.type)}`);
  }
};

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请先选择要删除的单据");
    return;
  }
  const approvedCount = selectedRows.value.filter(r => r.isApproved).length;
  if (approvedCount > 0) {
    ElMessage.warning(`选中的${approvedCount}条已审核单据无法删除,请先反审核`);
    return;
  }
  const ok = await confirm(
    `确认删除选中的${selectedRows.value.length}条单据?`,
    "批量删除",
    { type: "warning" }
  );
  if (!ok) return;

  try {
    let successCount = 0;
    let failCount = 0;
    const deletePromises = selectedRows.value.map(async row => {
      try {
        await deleteByType(row);
        successCount++;
      } catch {
        failCount++;
      }
    });
    await Promise.all(deletePromises);

    if (failCount === 0) {
      ElMessage.success(`成功删除${successCount}条单据`);
    } else {
      ElMessage.warning(`成功${successCount}条,失败${failCount}条`);
    }
    selectedRows.value = [];
    fetchData();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
};

const handleExport = () => {
  const count = selectedRows.value.length || dataList.value.length;
  ElMessage.info(`导出${count}条记录(功能开发中)`);
};

const handlePrint = () => {
  const count = selectedRows.value.length || dataList.value.length;
  ElMessage.info(`打印${count}条记录(功能开发中)`);
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
      <el-form-item label="单据类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择类型"
          clearable
          class="w-[130px]"
        >
          <el-option
            v-for="item in typeOptions"
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
          class="w-[120px]"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
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
          class="w-[220px]"
        />
      </el-form-item>
      <el-form-item label="关键字" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="单据编号/备注"
          clearable
          class="w-[160px]"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card>
      <PureTableBar title="库存单据列表" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(Download)"
            @click="handleExport"
          >
            导出
          </el-button>
          <el-button :icon="useRenderIcon(Printer)" @click="handlePrint">
            打印
          </el-button>
          <el-button
            type="danger"
            :icon="useRenderIcon(Delete)"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size="size"
            :columns="columns"
            border
            :data="dataList"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
            @selection-change="handleSelectionChange"
          >
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
                v-if="!row.isApproved"
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

.mb-4 {
  margin-bottom: 16px;
}

.text-primary {
  color: var(--el-color-primary);
}

.cursor-pointer {
  cursor: pointer;
}

.font-medium {
  font-weight: 500;
}
</style>

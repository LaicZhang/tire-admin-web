<script setup lang="ts">
import { ref, onMounted, h, reactive } from "vue";
import { getBatchListApi, getBatchTransactionsApi } from "@/api/batch";
import { getRepoListApi } from "@/api/company/repo";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { columns, transactionColumns } from "./columns";
import Search from "~icons/ep/search";
import Add from "~icons/ep/plus";
import View from "~icons/ep/view";
import { PureTableBar } from "@/components/RePureTableBar";
import { ElButton } from "element-plus";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import BatchCreateForm from "./BatchCreateForm.vue";

defineOptions({
  name: "BusinessBatch"
});

const loading = ref(false);
interface BatchItem {
  id?: string;
  uid: string;
  batchNo: string;
  tireName: string;
  repoName: string;
  quantity: number;
  productionDate: string;
  expiryDate: string;
}

interface RepoItem {
  uid: string;
  name: string;
}

const tableData = ref<BatchItem[]>([]);
const repoList = ref<RepoItem[]>([]);

// 查询条件
const queryForm = ref({
  repoId: undefined,
  tireId: undefined,
  batchNo: undefined
});

// 流水抽屉
const drawerVisible = ref(false);

interface TransactionItem {
  createdAt: string;
  type: "INBOUND" | "OUTBOUND";
  quantity: number;
  sourceType: string;
  sourceId: string;
}

const transactions = ref<TransactionItem[]>([]);
const currentBatchNo = ref("");

const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const getRepos = async () => {
  const { data, code } = await getRepoListApi(1, { limit: 100 });
  if (code === 200) {
    repoList.value = Array.isArray(data) ? data : data.list || [];
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getBatchListApi({
      ...queryForm.value
      // page: pagination.value.currentPage, // 假设API支持分页参数，若不支持则需调整API
      // limit: pagination.value.pageSize
    });
    // API定义里 getBatchListApi 只接受 repoId, tireId, batchNo，没有明确分页参数
    // 我们假设后端返回所有或支持分页。如果只返回列表:
    if (code === 200) {
      const typedData = data as unknown as
        | { list?: BatchItem[]; total?: number }
        | BatchItem[];
      const list = Array.isArray(typedData) ? typedData : typedData.list || [];
      tableData.value = list as BatchItem[];
      pagination.total = Array.isArray(typedData)
        ? typedData.length
        : typedData.total || list.length;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "加载批次列表失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleCreate = () => {
  addDialog({
    title: "新增批次",
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(BatchCreateForm, {
        repoList: repoList.value,
        onSuccess: () => {
          closeAllDialog();
          loadData();
        },
        onClose: () => closeAllDialog()
      })
  });
};

const handleViewTransactions = async (row: BatchItem) => {
  currentBatchNo.value = row.batchNo;
  drawerVisible.value = true;
  try {
    const { data, code } = await getBatchTransactionsApi(row.id || row.uid); // 使用id或uid
    if (code === 200) {
      const typedData = data as { list?: unknown[] } | unknown[];
      transactions.value = (
        Array.isArray(typedData) ? typedData : typedData.list || []
      ) as TransactionItem[];
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "获取流水失败";
    message(msg, { type: "error" });
  }
};

onMounted(() => {
  getRepos();
  loadData();
});
</script>

<template>
  <div class="main p-4">
    <el-card class="mb-4">
      <el-form :inline="true" :model="queryForm">
        <el-form-item label="仓库">
          <el-select
            v-model="queryForm.repoId"
            placeholder="选择仓库"
            clearable
            class="w-40"
          >
            <el-option
              v-for="item in repoList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="批次号">
          <el-input
            v-model="queryForm.batchNo"
            placeholder="请输入批次号"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="loadData"
          >
            查询
          </el-button>
          <el-button
            type="success"
            :icon="useRenderIcon(Add)"
            @click="handleCreate"
          >
            新增批次
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <PureTableBar title="批次管理" @refresh="loadData">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          stripe
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :columns="dynamicColumns"
          :data="tableData"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        >
          <template #operation="{ row }">
            <el-button
              link
              type="primary"
              :icon="useRenderIcon(View)"
              @click="handleViewTransactions(row)"
            >
              查看流水
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 流水抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`批次流水: ${currentBatchNo}`"
      size="50%"
    >
      <pure-table
        :data="transactions"
        :columns="transactionColumns"
        stripe
        border
      />
    </el-drawer>
  </div>
</template>

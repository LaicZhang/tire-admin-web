<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { getBatchListApi, getBatchTransactionsApi } from "@/api/batch";
import { getRepoListApi } from "@/api/company/repo";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { columns, transactionColumns } from "./columns";
import Search from "~icons/ep/search";
import Add from "~icons/ep/plus";
import View from "~icons/ep/view";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import BatchCreateForm from "./BatchCreateForm.vue";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

defineOptions({
  name: "BusinessBatch"
});

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

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  BatchItem,
  CommonResult<{ list: BatchItem[]; total?: number } | BatchItem[]>,
  { page: number; pageSize: number }
>({
  api: () =>
    getBatchListApi({ ...queryForm.value }) as Promise<
      CommonResult<{ list: BatchItem[]; total?: number } | BatchItem[]>
    >,
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "加载批次列表失败", { type: "error" });
      return { list: [], total: 0 };
    }
    const data = res.data;
    const list = (
      Array.isArray(data) ? data : (data as { list?: BatchItem[] })?.list || []
    ) as BatchItem[];
    const total = Array.isArray(data)
      ? data.length
      : (data as { total?: number })?.total || list.length;
    return { list, total };
  },
  immediate: false
});

const getRepos = async () => {
  const { data, code } = await getRepoListApi(1, { limit: 100 });
  if (code === 200) {
    repoList.value = Array.isArray(data) ? data : data.list || [];
  }
};

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
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
          fetchData();
        },
        onClose: () => closeAllDialog()
      })
  });
};

const handleViewTransactions = async (row: BatchItem) => {
  currentBatchNo.value = row.batchNo;
  drawerVisible.value = true;
  try {
    const { data, code } = await getBatchTransactionsApi(
      Number(row.id || row.uid)
    );
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
  fetchData();
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
            @click="handleSearch"
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

    <PureTableBar title="批次管理" @refresh="fetchData">
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
          :data="dataList"
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

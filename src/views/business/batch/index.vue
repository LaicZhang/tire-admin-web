<script setup lang="ts">
import { ref, onMounted, h, reactive } from "vue";
import {
  getBatchListApi,
  createBatchApi,
  getBatchTransactionsApi
} from "@/api/batch";
import { getRepoListApi } from "@/api/company/repo";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Add from "~icons/ep/plus";
import View from "~icons/ep/view";
import { PureTableBar } from "@/components/RePureTableBar";
import type { TableColumnList } from "@pureadmin/table";
import { ElTag, ElButton } from "element-plus";

defineOptions({
  name: "BusinessBatch"
});

const loading = ref(false);
const tableData = ref<any[]>([]);
const repoList = ref<any[]>([]);

// 查询条件
const queryForm = ref({
  repoId: undefined,
  tireId: undefined, // 暂未提供轮胎选择组件，可扩展
  batchNo: undefined
});

// 分页
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 新增批次弹窗
const dialogVisible = ref(false);
const formRef = ref<any>(null);
const batchForm = ref({
  repoId: undefined,
  tireId: undefined, // 需轮胎选择
  batchNo: "",
  quantity: 0,
  productionDate: "",
  expiryDate: ""
});
const rules = {
  repoId: [{ required: true, message: "请选择仓库", trigger: "change" }],
  tireId: [{ required: true, message: "请输入轮胎ID", trigger: "blur" }], // 简化为输入ID
  batchNo: [{ required: true, message: "请输入批次号", trigger: "blur" }],
  quantity: [{ required: true, message: "请输入数量", trigger: "blur" }]
};

// 流水抽屉
const drawerVisible = ref(false);
const transactions = ref<any[]>([]);
const currentBatchNo = ref("");

const columns: TableColumnList = [
  {
    label: "批次号",
    prop: "batchNo",
    minWidth: 120
  },
  {
    label: "商品名称",
    prop: "tireName",
    minWidth: 150
  },
  {
    label: "所在仓库",
    prop: "repoName",
    minWidth: 120
  },
  {
    label: "当前数量",
    prop: "quantity",
    width: 100
  },
  {
    label: "生产日期",
    prop: "productionDate",
    width: 120
  },
  {
    label: "过期日期",
    prop: "expiryDate",
    width: 120
  },
  {
    label: "操作",
    fixed: "right",
    width: 120,
    slot: "operation"
  }
];

const transactionColumns: TableColumnList = [
  {
    label: "时间",
    prop: "createdAt",
    width: 160
  },
  {
    label: "类型",
    prop: "type",
    width: 80,
    cellRenderer: ({ row }) => {
      return h(ElTag, { type: row.type === "IN" ? "success" : "danger" }, () =>
        row.type === "IN" ? "入库" : "出库"
      );
    }
  },
  {
    label: "数量",
    prop: "quantity",
    width: 100
  },
  {
    label: "来源类型",
    prop: "sourceType"
  },
  {
    label: "单号",
    prop: "sourceId"
  }
];

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
      const typedData = data as
        | { list?: unknown[]; total?: number }
        | unknown[];
      const list = Array.isArray(typedData) ? typedData : typedData.list || [];
      tableData.value = list;
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
  dialogVisible.value = true;
  batchForm.value = {
    repoId: undefined,
    tireId: undefined,
    batchNo: "",
    quantity: 0,
    productionDate: "",
    expiryDate: ""
  };
};

const submitCreate = async () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        await createBatchApi(batchForm.value as any);
        message("批次创建成功", { type: "success" });
        dialogVisible.value = false;
        loadData();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "创建失败";
        message(msg, { type: "error" });
      }
    }
  });
};

const handleViewTransactions = async (row: any) => {
  currentBatchNo.value = row.batchNo;
  drawerVisible.value = true;
  try {
    const { data, code } = await getBatchTransactionsApi(row.id || row.uid); // 使用id或uid
    if (code === 200) {
      const typedData = data as { list?: unknown[] } | unknown[];
      transactions.value = Array.isArray(typedData)
        ? typedData
        : typedData.list || [];
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

    <!-- 新增弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增批次" width="500px">
      <el-form
        ref="formRef"
        :model="batchForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="仓库" prop="repoId">
          <el-select
            v-model="batchForm.repoId"
            placeholder="请选择仓库"
            class="w-full"
          >
            <el-option
              v-for="item in repoList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品ID" prop="tireId">
          <el-input v-model="batchForm.tireId" placeholder="请输入商品ID" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchNo">
          <el-input v-model="batchForm.batchNo" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="初始数量" prop="quantity">
          <el-input-number
            v-model="batchForm.quantity"
            :min="1"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="生产日期" prop="productionDate">
          <el-date-picker
            v-model="batchForm.productionDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="过期日期" prop="expiryDate">
          <el-date-picker
            v-model="batchForm.expiryDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">确认</el-button>
      </template>
    </el-dialog>

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

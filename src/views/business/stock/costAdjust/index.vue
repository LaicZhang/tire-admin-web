<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { handleApiError } from "@/utils/error";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import {
  getCostAdjustOrderList,
  approveCostAdjustOrder,
  rejectCostAdjustOrder,
  deleteCostAdjustOrder,
  type CostAdjustOrder
} from "@/api/business/costAdjust";
import { httpLogger } from "@/utils/logger";
import { formatMoney } from "@/utils/formatMoney";
import dayjs from "dayjs";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "CostAdjust"
});

// 列表数据
const tableData = ref<CostAdjustOrder[]>([]);
const loading = ref(false);
const { confirm } = useConfirmDialog();
const pagination = ref({
  total: 0,
  pageSize: 15,
  currentPage: 1,
  background: true
});

// 查询参数
const queryParams = reactive({
  isApproved: "all" as "all" | boolean
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

// 筛选选项
const approvalOptions = [
  { label: "全部", value: "all" },
  { label: "待审核", value: false },
  { label: "已审核", value: true }
];

// 获取列表数据
const fetchData = async () => {
  loading.value = true;
  try {
    const data = await getCostAdjustOrderList({
      index: pagination.value.currentPage,
      isApproved:
        queryParams.isApproved === "all" ? undefined : queryParams.isApproved
    });
    tableData.value = data.list;
    pagination.value.total = data.count;
  } catch (error) {
    httpLogger.error("获取成本调整单列表失败", error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

// 重置搜索
const onReset = () => {
  searchFormRef.value?.resetFields();
  queryParams.isApproved = "all";
  handleSearch();
};

// 翻页
const handlePageChange = (val: number) => {
  pagination.value.currentPage = val;
  fetchData();
};

// 审核
const handleApprove = async (row: CostAdjustOrder) => {
  const ok = await confirm(
    `确认审核成本调整单 #${row.number}？审核后将更新相关商品的库存成本。`,
    "确认审核",
    { type: "warning" }
  );
  if (!ok) return;

  try {
    await approveCostAdjustOrder(row.id);
    ElMessage.success("审核成功");
    fetchData();
  } catch (error) {
    handleApiError(error);
  }
};

// 拒绝
const handleReject = async (row: CostAdjustOrder) => {
  try {
    const res = await ElMessageBox.prompt("请输入拒绝原因", "拒绝审核", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "请输入拒绝原因"
    });
    if (typeof res === "string") return;
    const { value } = res;
    await rejectCostAdjustOrder(row.id, value);
    ElMessage.success("已拒绝");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      handleApiError(error);
    }
  }
};

// 删除
const handleDelete = async (row: CostAdjustOrder) => {
  const ok = await confirm("确认删除该成本调整单？", "确认删除", {
    type: "warning"
  });
  if (!ok) return;

  try {
    await deleteCostAdjustOrder(row.id);
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    handleApiError(error);
  }
};

// 格式化状态
const getStatusTag = (row: CostAdjustOrder) => {
  if (row.isApproved) {
    return { type: "success" as const, text: "已审核" };
  }
  if (row.isLocked) {
    return { type: "danger" as const, text: "已拒绝" };
  }
  return { type: "warning" as const, text: "待审核" };
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="main">
    <!-- 搜索栏 -->
    <ReSearchForm
      ref="searchFormRef"
      :form="queryParams"
      :loading="loading"
      @search="handleSearch"
      @reset="onReset"
    >
      <el-form-item label="审核状态">
        <el-select
          v-model="queryParams.isApproved"
          placeholder="请选择"
          clearable
        >
          <el-option
            v-for="item in approvalOptions"
            :key="String(item.value)"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <!-- 数据表格 -->
    <el-card>
      <PureTableBar title="成本调整单列表" @refresh="fetchData">
        <template #buttons>
          <el-button type="primary" :icon="useRenderIcon(AddFill)">
            新增调整单
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size="size"
            :columns="columns"
            border
            :data="tableData"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
          >
            <template #status="{ row }">
              <el-tag :type="getStatusTag(row).type" size="small">
                {{ getStatusTag(row).text }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-button
                v-if="!row.isApproved && !row.isLocked"
                type="primary"
                size="small"
                link
                @click="handleApprove(row)"
              >
                审核
              </el-button>
              <el-button
                v-if="!row.isApproved && !row.isLocked"
                type="warning"
                size="small"
                link
                @click="handleReject(row)"
              >
                拒绝
              </el-button>
              <el-button
                v-if="!row.isApproved"
                type="danger"
                size="small"
                link
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

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-primary {
  font-weight: 500;
  color: var(--el-color-primary);
}

.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

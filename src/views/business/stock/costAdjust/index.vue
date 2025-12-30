<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getCostAdjustOrderList,
  approveCostAdjustOrder,
  rejectCostAdjustOrder,
  deleteCostAdjustOrder,
  type CostAdjustOrder
} from "@/api/business/costAdjust";
import { formatMoney } from "@/utils/formatMoney";
import dayjs from "dayjs";
import { PureTableBar } from "@/components/RePureTableBar";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "CostAdjust"
});

// 列表数据
const tableData = ref<CostAdjustOrder[]>([]);
const loading = ref(false);
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
    console.error("获取成本调整单列表失败", error);
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
const handleReset = () => {
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
  try {
    await ElMessageBox.confirm(
      `确认审核成本调整单 #${row.number}？审核后将更新相关商品的库存成本。`,
      "确认审核",
      { type: "warning" }
    );
    await approveCostAdjustOrder(row.id);
    ElMessage.success("审核成功");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("审核失败");
    }
  }
};

// 拒绝
const handleReject = async (row: CostAdjustOrder) => {
  try {
    const { value } = await ElMessageBox.prompt("请输入拒绝原因", "拒绝审核", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "请输入拒绝原因"
    });
    await rejectCostAdjustOrder(row.id, value);
    ElMessage.success("已拒绝");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

// 删除
const handleDelete = async (row: CostAdjustOrder) => {
  try {
    await ElMessageBox.confirm("确认删除该成本调整单？", "确认删除", {
      type: "warning"
    });
    await deleteCostAdjustOrder(row.id);
    ElMessage.success("删除成功");
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
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
    <el-card class="mb-4">
      <el-form :inline="true" :model="queryParams" class="search-form">
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
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button :icon="useRenderIcon(Refresh)" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

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

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

defineOptions({
  name: "CostAdjust"
});

// 列表数据
const tableData = ref<CostAdjustOrder[]>([]);
const loading = ref(false);
const total = ref(0);

// 查询参数
const queryParams = reactive({
  index: 1,
  isApproved: undefined as boolean | undefined
});

// 筛选选项
const approvalOptions = [
  { label: "全部", value: undefined },
  { label: "待审核", value: false },
  { label: "已审核", value: true }
];

// 获取列表数据
const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await getCostAdjustOrderList(queryParams);
    tableData.value = data.list;
    total.value = data.count;
  } catch (error) {
    console.error("获取成本调整单列表失败", error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  queryParams.index = 1;
  fetchData();
};

// 重置搜索
const handleReset = () => {
  queryParams.index = 1;
  queryParams.isApproved = undefined;
  fetchData();
};

// 翻页
const handlePageChange = (page: number) => {
  queryParams.index = page;
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

// 格式化金额
const formatAmount = (amount: bigint | number) => {
  return formatMoney(Number(amount));
};

// 格式化日期
const formatDate = (date?: string) => {
  return date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-";
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
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成本调整单列表</span>
          <el-button type="primary" size="small">
            <template #icon>
              <i class="ep:plus" />
            </template>
            新增调整单
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" stripe>
        <el-table-column prop="number" label="单据编号" width="180">
          <template #default="{ row }">
            <span class="text-primary">#{{ row.number }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row).type" size="small">
              {{ getStatusTag(row).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="调整金额" width="120">
          <template #default="{ row }">
            <span
              :class="
                Number(row.totalAdjustAmount) >= 0
                  ? 'text-success'
                  : 'text-danger'
              "
            >
              {{ formatAmount(row.totalAdjustAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="reason"
          label="调整原因"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">
            {{ row.operator?.name || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="审核人" width="100">
          <template #default="{ row }">
            {{ row.auditor?.name || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createAt) }}
          </template>
        </el-table-column>
        <el-table-column label="审核时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.auditAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
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
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.index"
          :total="total"
          :page-size="15"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
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

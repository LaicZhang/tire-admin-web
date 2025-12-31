<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { http } from "@/utils/http";
import { formatMoney } from "@/utils/formatMoney";
import dayjs from "dayjs";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { PureTable } from "@pureadmin/table";
import type { PaginationProps } from "@pureadmin/table";

defineOptions({
  name: "Income"
});

interface OtherTransaction {
  id: number;
  uid: string;
  type: string;
  amount: bigint;
  direction: "IN" | "OUT";
  category?: string;
  remark?: string;
  createdAt: string;
  payment?: {
    name: string;
  };
}

// 列表数据
const tableData = ref<OtherTransaction[]>([]);
const loading = ref(false);

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 20
});

const pagination = reactive<PaginationProps>({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

const columns: TableColumnList = [
  {
    label: "收入类型",
    prop: "type",
    width: 120,
    slot: "type"
  },
  {
    label: "金额",
    prop: "amount",
    width: 150,
    slot: "amount"
  },
  {
    label: "收款账户",
    prop: "payment.name",
    width: 150,
    slot: "payment"
  },
  {
    label: "分类",
    prop: "category",
    width: 120
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    label: "创建时间",
    prop: "createdAt",
    width: 180,
    slot: "createdAt"
  }
];

// 新增对话框
const dialogVisible = ref(false);
const dialogLoading = ref(false);
const formRef = ref();
const form = reactive({
  type: "",
  category: "",
  amount: 0,
  paymentId: "",
  remark: ""
});

// 收入类型选项
const incomeTypes = [
  { label: "利息收入", value: "利息收入" },
  { label: "租金收入", value: "租金收入" },
  { label: "废品变卖", value: "废品变卖" },
  { label: "政府补贴", value: "政府补贴" },
  { label: "其他收入", value: "其他收入" }
];

// 结算账户（需要从API获取）
const paymentList = ref<{ uid: string; name: string }[]>([]);

// 获取结算账户列表
const fetchPaymentList = async () => {
  try {
    const { data } = await http.get<
      never,
      CommonResult<{ list: { uid: string; name: string }[] }>
    >("/payment/1");
    paymentList.value = data.list;
  } catch (error) {
    console.error("获取结算账户失败", error);
  }
};

// 获取列表数据（仅收入）
const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await http.get<
      never,
      CommonResult<PaginatedResponseDto<OtherTransaction>>
    >(`/finance-extension/other-transaction/${queryParams.index}`, {
      params: { direction: "IN", size: queryParams.size }
    });
    tableData.value = data.list;
    pagination.total = data.total ?? data.count;
    pagination.currentPage = queryParams.index;
    pagination.pageSize = queryParams.size;
  } catch (error) {
    console.error("获取收入单列表失败", error);
  } finally {
    loading.value = false;
  }
};

// 翻页
const onPageChange = (val: PaginationProps) => {
  queryParams.index = val.currentPage;
  queryParams.size = val.pageSize;
  fetchData();
};

// 打开新增对话框
const handleAdd = () => {
  Object.assign(form, {
    type: "",
    category: "",
    amount: 0,
    paymentId: "",
    remark: ""
  });
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  if (!form.type) {
    ElMessage.warning("请选择收入类型");
    return;
  }
  if (!form.amount || form.amount <= 0) {
    ElMessage.warning("请输入有效金额");
    return;
  }
  if (!form.paymentId) {
    ElMessage.warning("请选择收款账户");
    return;
  }

  dialogLoading.value = true;
  try {
    await http.post("/finance-extension/other-transaction", {
      data: {
        type: form.type,
        category: form.category || form.type,
        amount: Math.round(form.amount * 100), // 转换为分
        direction: "IN", // 收入方向
        remark: form.remark,
        payment: { connect: { uid: form.paymentId } }
      }
    });
    ElMessage.success("创建成功");
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    ElMessage.error("创建失败");
  } finally {
    dialogLoading.value = false;
  }
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
  fetchPaymentList();
});
</script>

<template>
  <div class="main">
    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>其他收入单列表</span>
          <el-button type="primary" size="small" @click="handleAdd">
            <template #icon>
              <i class="ep:plus" />
            </template>
            新增收入单
          </el-button>
        </div>
      </template>

      <PureTable
        border
        stripe
        :loading="loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        @page-current-change="
          val => onPageChange({ ...pagination, currentPage: val })
        "
        @page-size-change="
          val => onPageChange({ ...pagination, pageSize: val })
        "
      >
        <template #type="{ row }">
          <el-tag type="success" size="small">{{ row.type }}</el-tag>
        </template>
        <template #amount="{ row }">
          <span class="text-success">+{{ formatAmount(row.amount) }}</span>
        </template>
        <template #payment="{ row }">
          {{ row.payment?.name || "-" }}
        </template>
        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </PureTable>
    </el-card>

    <!-- 新增对话框 -->
    <el-dialog v-model="dialogVisible" title="新增收入单" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="收入类型" required>
          <el-select
            v-model="form.type"
            placeholder="请选择收入类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in incomeTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="收款账户" required>
          <el-select
            v-model="form.paymentId"
            placeholder="请选择收款账户"
            style="width: 100%"
          >
            <el-option
              v-for="item in paymentList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" required>
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="可选分类" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="dialogLoading"
          @click="handleSubmit"
        >
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-success {
  font-weight: 500;
  color: var(--el-color-success);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

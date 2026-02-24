<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, h, onMounted, computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import ExportIcon from "~icons/ri/download-cloud-2-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { MoneyDisplay } from "@/components";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import type { CustomerBalance, CustomerBalanceForm } from "./types";
import type { FormInstance } from "element-plus";
import {
  createInitialBalanceApi,
  getInitialBalanceBatchApi,
  type InitialBalanceRecord
} from "@/api/data/initial-balance";
import {
  getCustomerListApi,
  getCustomerBatchApi,
  type Customer
} from "@/api/business/customer";

defineOptions({
  name: "CustomerBalance"
});

const dataList = ref<CustomerBalance[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const selectedRows = ref<CustomerBalance[]>([]);
const form = ref({
  keyword: undefined,
  hasBalance: undefined
});
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const columns = [
  { type: "selection", width: 50 },
  { label: "ID", prop: "id", width: 80 },
  { label: "客户名称", prop: "customerName" },
  { label: "客户编码", prop: "customerCode", width: 120 },
  { label: "联系电话", prop: "phone", width: 130 },
  {
    label: "期初应收余额",
    prop: "receivableBalance",
    slot: "receivableBalance",
    width: 130
  },
  {
    label: "期初预收余额",
    prop: "advanceBalance",
    slot: "advanceBalance",
    width: 130
  },
  { label: "余额日期", prop: "balanceDate", width: 120 },
  { label: "备注", prop: "remark" },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 140
  }
];

const CUSTOMER_RECEIVABLE_TYPE = "customer-receivable";
const CUSTOMER_ADVANCE_TYPE = "customer-advance";

const toYuan = (amount: string | number | null | undefined) =>
  amount === null || amount === undefined ? 0 : Number(amount) / 100;

const toCents = (amount: number | null | undefined) =>
  Math.round(Number(amount || 0) * 100);

const today = () => new Date().toISOString().slice(0, 10);

// 统计信息
const statistics = computed(() => {
  const totalReceivable = dataList.value.reduce(
    (sum, item) => sum + (item.receivableBalance || 0),
    0
  );
  const totalAdvance = dataList.value.reduce(
    (sum, item) => sum + (item.advanceBalance || 0),
    0
  );
  return {
    totalReceivable,
    totalAdvance,
    customerCount: dataList.value.length
  };
});

const getList = async () => {
  loading.value = true;
  try {
    const { code, data, msg } = await getCustomerListApi(
      pagination.value.currentPage,
      { keyword: form.value.keyword || undefined }
    );
    if (code !== 200) {
      message(msg || "获取客户列表失败", { type: "error" });
      return;
    }

    const customers = data.list || [];
    if (!customers.length) {
      dataList.value = [];
      pagination.value.total = 0;
      return;
    }

    // 批量获取客户详情和期初余额 (2次请求代替 N*3 次)
    const customerIds = customers.map(c => c.uid);
    const [customersRes, balancesRes] = await Promise.all([
      getCustomerBatchApi(customerIds).catch(() => null),
      getInitialBalanceBatchApi({
        customerIds,
        types: [CUSTOMER_RECEIVABLE_TYPE, CUSTOMER_ADVANCE_TYPE]
      }).catch(() => null)
    ]);

    // 构建映射
    const customerMap = new Map<string, Customer>();
    for (const c of customersRes?.data || []) {
      if (c?.uid) customerMap.set(c.uid, c);
    }
    const balanceMap = new Map<
      string,
      { receivable?: InitialBalanceRecord; advance?: InitialBalanceRecord }
    >();
    for (const b of balancesRes?.data || []) {
      if (!b.customerId) continue;
      const existing = balanceMap.get(b.customerId) || {};
      if (b.type === CUSTOMER_RECEIVABLE_TYPE) existing.receivable = b;
      else if (b.type === CUSTOMER_ADVANCE_TYPE) existing.advance = b;
      balanceMap.set(b.customerId, existing);
    }

    // 组装数据
    const rows = customers.map(c => {
      const customerId = c.uid;
      const customer = customerMap.get(customerId) ?? c;
      const balances = balanceMap.get(customerId) || {};
      const receivableRow = balances.receivable;
      const advanceRow = balances.advance;

      const receivableBalance = toYuan(receivableRow?.amount);
      const advanceBalance = toYuan(advanceRow?.amount);
      const balanceDate =
        (receivableRow?.date || advanceRow?.date || "")
          .toString()
          .slice(0, 10) || undefined;

      const hasAny = receivableBalance !== 0 || advanceBalance !== 0;
      if (form.value.hasBalance === true && !hasAny) return null;
      if (form.value.hasBalance === false && hasAny) return null;

      return {
        id: customer.id ?? 0,
        uid: customerId,
        customerId,
        customerName: customer.name,
        customerCode: customer.code ?? "-",
        phone: customer.info?.phone ?? customer.phone ?? "-",
        receivableBalance,
        advanceBalance,
        balanceDate,
        remark: receivableRow?.remark || advanceRow?.remark || "",
        createdAt: (receivableRow?.createdAt || advanceRow?.createdAt) ?? ""
      } as CustomerBalance;
    });

    dataList.value = rows.filter(Boolean) as CustomerBalance[];
    pagination.value.total = data.count || 0;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  pagination.value.currentPage = 1;
  getList();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  getList();
};

const handleSelectionChange = (rows: CustomerBalance[]) => {
  selectedRows.value = rows;
};

const dialogFormRef = ref<{ getRef: () => FormInstance } | null>(null);

const openDialog = (title = "新增", row?: CustomerBalance) => {
  addDialog({
    title: `${title}客户期初余额`,
    props: {
      formInline: {
        id: row?.id,
        uid: row?.uid,
        customerId: row?.customerId ?? "",
        receivableBalance: row?.receivableBalance ?? 0,
        advanceBalance: row?.advanceBalance ?? 0,
        balanceDate: row?.balanceDate,
        remark: row?.remark ?? ""
      },
      isEdit: title === "编辑"
    },
    width: "500px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: dialogFormRef,
        formInline: (options.props as { formInline: CustomerBalanceForm })
          .formInline,
        isEdit: (options.props as { isEdit: boolean }).isEdit
      }),
    beforeSure: (done, { options }) => {
      const FormRef = dialogFormRef.value?.getRef();
      if (!FormRef) return;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          const cur = (options.props as { formInline: CustomerBalanceForm })
            .formInline;
          const date = cur.balanceDate || today();
          const tasks = [
            createInitialBalanceApi({
              type: CUSTOMER_RECEIVABLE_TYPE,
              amount: toCents(cur.receivableBalance),
              date,
              remark: cur.remark,
              customerId: cur.customerId
            }),
            createInitialBalanceApi({
              type: CUSTOMER_ADVANCE_TYPE,
              amount: toCents(cur.advanceBalance),
              date,
              remark: cur.remark,
              customerId: cur.customerId
            })
          ];
          const results = await Promise.all(tasks);
          const failed = results.find(r => r.code !== 200);
          if (failed) {
            message(failed.msg || `${title}失败`, {
              type: "error"
            });
            return;
          }
          message(`${title}成功`, { type: "success" });
          done();
          getList();
        }
      });
    }
  });
};

const handleDelete = async (row: CustomerBalance) => {
  const date = today();
  const [r1, r2] = await Promise.all([
    createInitialBalanceApi({
      type: CUSTOMER_RECEIVABLE_TYPE,
      amount: 0,
      date,
      remark: "clear",
      customerId: row.customerId
    }),
    createInitialBalanceApi({
      type: CUSTOMER_ADVANCE_TYPE,
      amount: 0,
      date,
      remark: "clear",
      customerId: row.customerId
    })
  ]);
  if (r1.code === 200 && r2.code === 200) {
    message(`清空${row.customerName}的期初余额成功`, { type: "success" });
    getList();
  } else {
    message("清空失败", { type: "error" });
  }
};

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    message("请选择要删除的数据", { type: "warning" });
    return;
  }
  const date = today();
  Promise.all(
    selectedRows.value.flatMap(row => [
      createInitialBalanceApi({
        type: CUSTOMER_RECEIVABLE_TYPE,
        amount: 0,
        date,
        remark: "clear",
        customerId: row.customerId
      }),
      createInitialBalanceApi({
        type: CUSTOMER_ADVANCE_TYPE,
        amount: 0,
        date,
        remark: "clear",
        customerId: row.customerId
      })
    ])
  ).then(() => {
    message(`批量清空${selectedRows.value.length}条数据成功`, {
      type: "success"
    });
    getList();
  });
};

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="main">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="m-1">
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="客户数量" :value="statistics.customerCount">
            <template #suffix>
              <span class="text-sm text-gray-400">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic
            title="期初应收总额"
            :value="statistics.totalReceivable"
            :precision="2"
          >
            <template #prefix>
              <span class="text-orange-500">&#165;</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic
            title="期初预收总额"
            :value="statistics.totalAdvance"
            :precision="2"
          >
            <template #prefix>
              <span class="text-green-500">&#165;</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="客户名称" prop="keyword">
        <el-input
          v-model="form.keyword"
          placeholder="请输入客户名称/编码"
          clearable
          class="w-[200px]"
        />
      </el-form-item>
      <el-form-item label="有余额" prop="hasBalance">
        <el-select
          v-model="form.hasBalance"
          placeholder="全部"
          clearable
          class="w-[120px]"
        >
          <el-option label="有应收" :value="true" />
          <el-option label="无余额" :value="false" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="客户期初余额" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增
          </el-button>
          <el-button
            type="danger"
            :icon="useRenderIcon(Delete)"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-button :icon="useRenderIcon(ImportIcon)"> 导入 </el-button>
          <el-button :icon="useRenderIcon(ExportIcon)"> 导出 </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
            @selection-change="handleSelectionChange"
          >
            <template #receivableBalance="{ row }">
              <span
                :class="
                  row.receivableBalance > 0
                    ? 'text-orange-500 font-bold'
                    : 'text-gray-400'
                "
              >
                <MoneyDisplay
                  :value="
                    row.receivableBalance > 0 ? row.receivableBalance : null
                  "
                  :show-symbol="false"
                  empty-text="-"
                />
              </span>
            </template>
            <template #advanceBalance="{ row }">
              <span
                :class="
                  row.advanceBalance > 0
                    ? 'text-green-500 font-bold'
                    : 'text-gray-400'
                "
              >
                <MoneyDisplay
                  :value="row.advanceBalance > 0 ? row.advanceBalance : null"
                  :show-symbol="false"
                  empty-text="-"
                />
              </span>
            </template>
            <template #operation="{ row }">
              <el-button link type="primary" @click="openDialog('编辑', row)">
                编辑
              </el-button>
              <DeleteButton
                :show-icon="false"
                :title="`确认删除${row.customerName}的期初余额?`"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

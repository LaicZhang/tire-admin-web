<script setup lang="ts">
import { ref, h, onMounted, computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import ImportIcon from "~icons/ri/upload-cloud-2-line";
import ExportIcon from "~icons/ri/download-cloud-2-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import type { CustomerBalance, CustomerBalanceForm } from "./types";
import type { FormInstance } from "element-plus";
import {
  createInitialBalanceApi,
  getInitialBalanceListApi
} from "@/api/data/initial-balance";
import { getCustomerApi, getCustomerListApi } from "@/api/business/customer";

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
  pageSize: 10,
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
    const rows = await Promise.all(
      customers.map(async c => {
        const customerId = (c as unknown).uid as string;
        const [details, receivable, advance] = await Promise.all([
          getCustomerApi(customerId).catch(() => null),
          getInitialBalanceListApi(1, {
            customerId,
            type: CUSTOMER_RECEIVABLE_TYPE
          }).catch(() => null),
          getInitialBalanceListApi(1, {
            customerId,
            type: CUSTOMER_ADVANCE_TYPE
          }).catch(() => null)
        ]);

        const customer = (details as unknown)?.data ?? c;
        const receivableRow = (receivable as unknown)?.data?.list?.[0];
        const advanceRow = (advance as unknown)?.data?.list?.[0];

        const receivableBalance = toYuan(receivableRow?.amount);
        const advanceBalance = toYuan(advanceRow?.amount);
        const balanceDate =
          (receivableRow?.date || advanceRow?.date || "")
            ?.toString?.()
            ?.slice?.(0, 10) || undefined;

        const hasAny = receivableBalance !== 0 || advanceBalance !== 0;
        if (form.value.hasBalance === true && !hasAny) return null;
        if (form.value.hasBalance === false && hasAny) return null;

        return {
          id: (customer as unknown).id ?? (c as unknown).id ?? 0,
          uid: customerId,
          customerId,
          customerName: (customer as unknown).name,
          customerCode: (customer as unknown).code ?? "-",
          phone:
            (customer as unknown)?.info?.phone ??
            (customer as unknown).phone ??
            "-",
          receivableBalance,
          advanceBalance,
          balanceDate,
          remark: receivableRow?.remark || advanceRow?.remark || "",
          createdAt: (receivableRow?.createdAt || advanceRow?.createdAt) ?? ""
        } as CustomerBalance;
      })
    );

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
          const failed = results.find(r => (r as unknown).code !== 200);
          if (failed) {
            message((failed as unknown).msg || `${title}失败`, {
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
  if ((r1 as unknown).code === 200 && (r2 as unknown).code === 200) {
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
                {{
                  row.receivableBalance > 0
                    ? row.receivableBalance.toFixed(2)
                    : "-"
                }}
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
                {{
                  row.advanceBalance > 0 ? row.advanceBalance.toFixed(2) : "-"
                }}
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

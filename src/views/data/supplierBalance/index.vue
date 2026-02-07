<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "../../../utils/constants";
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
import type { SupplierBalance, SupplierBalanceForm } from "./types";
import type { FormInstance } from "element-plus";
import {
  createInitialBalanceApi,
  getInitialBalanceBatchApi,
  type InitialBalanceRecord
} from "@/api/data/initial-balance";
import {
  getProviderListApi,
  getProviderBatchApi,
  type Provider
} from "@/api/business/provider";

defineOptions({
  name: "SupplierBalance"
});

const dataList = ref<SupplierBalance[]>([]);
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const selectedRows = ref<SupplierBalance[]>([]);
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
  { label: "供应商名称", prop: "supplierName" },
  { label: "供应商编码", prop: "supplierCode", width: 120 },
  { label: "联系电话", prop: "phone", width: 130 },
  {
    label: "期初应付余额",
    prop: "payableBalance",
    slot: "payableBalance",
    width: 130
  },
  {
    label: "期初预付余额",
    prop: "prepaidBalance",
    slot: "prepaidBalance",
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

const PROVIDER_PAYABLE_TYPE = "provider-payable";
const PROVIDER_PREPAID_TYPE = "provider-prepaid";

const toYuan = (amount: string | number | null | undefined) =>
  amount === null || amount === undefined ? 0 : Number(amount) / 100;

const toCents = (amount: number | null | undefined) =>
  Math.round(Number(amount || 0) * 100);

const today = () => new Date().toISOString().slice(0, 10);

// 统计信息
const statistics = computed(() => {
  const totalPayable = dataList.value.reduce(
    (sum, item) => sum + (item.payableBalance || 0),
    0
  );
  const totalPrepaid = dataList.value.reduce(
    (sum, item) => sum + (item.prepaidBalance || 0),
    0
  );
  return {
    totalPayable,
    totalPrepaid,
    supplierCount: dataList.value.length
  };
});

const getList = async () => {
  loading.value = true;
  try {
    const { code, data, msg } = await getProviderListApi(
      pagination.value.currentPage,
      { keyword: form.value.keyword || undefined }
    );
    if (code !== 200) {
      message(msg || "获取供应商列表失败", { type: "error" });
      return;
    }

    const providers = data.list || [];
    if (!providers.length) {
      dataList.value = [];
      pagination.value.total = 0;
      return;
    }

    // 批量获取供应商详情和期初余额 (2次请求代替 N*3 次)
    const providerIds = providers.map(p => p.uid);
    const [providersRes, balancesRes] = await Promise.all([
      getProviderBatchApi(providerIds).catch(() => null),
      getInitialBalanceBatchApi({
        providerIds,
        types: [PROVIDER_PAYABLE_TYPE, PROVIDER_PREPAID_TYPE]
      }).catch(() => null)
    ]);

    // 构建映射
    const providerMap = new Map<string, Provider>();
    for (const p of providersRes?.data || []) {
      if (p?.uid) providerMap.set(p.uid, p);
    }
    const balanceMap = new Map<
      string,
      { payable?: InitialBalanceRecord; prepaid?: InitialBalanceRecord }
    >();
    for (const b of balancesRes?.data || []) {
      if (!b.providerId) continue;
      const existing = balanceMap.get(b.providerId) || {};
      if (b.type === PROVIDER_PAYABLE_TYPE) existing.payable = b;
      else if (b.type === PROVIDER_PREPAID_TYPE) existing.prepaid = b;
      balanceMap.set(b.providerId, existing);
    }

    // 组装数据
    const rows = providers.map(p => {
      const providerId = p.uid;
      const provider = providerMap.get(providerId) ?? p;
      const balances = balanceMap.get(providerId) || {};
      const payableRow = balances.payable;
      const prepaidRow = balances.prepaid;

      const payableBalance = toYuan(payableRow?.amount);
      const prepaidBalance = toYuan(prepaidRow?.amount);
      const balanceDate =
        (payableRow?.date || prepaidRow?.date || "").toString().slice(0, 10) ||
        undefined;

      const hasAny = payableBalance !== 0 || prepaidBalance !== 0;
      if (form.value.hasBalance === true && !hasAny) return null;
      if (form.value.hasBalance === false && hasAny) return null;

      return {
        id: provider.id ?? 0,
        uid: providerId,
        supplierId: providerId,
        supplierName: provider.name,
        supplierCode: provider.code ?? "-",
        phone: provider.phone ?? "-",
        payableBalance,
        prepaidBalance,
        balanceDate,
        remark: payableRow?.remark || prepaidRow?.remark || "",
        createdAt: (payableRow?.createdAt || prepaidRow?.createdAt) ?? ""
      } as SupplierBalance;
    });

    dataList.value = rows.filter(Boolean) as SupplierBalance[];
    pagination.value.total = data.count || 0;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  pagination.value.currentPage = 1;
  getList();
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
  getList();
};

const handleSelectionChange = (rows: SupplierBalance[]) => {
  selectedRows.value = rows;
};

const dialogFormRef = ref<{ getRef: () => FormInstance } | null>(null);

const openDialog = (title = "新增", row?: SupplierBalance) => {
  addDialog({
    title: `${title}供应商期初余额`,
    props: {
      formInline: {
        id: row?.id,
        uid: row?.uid,
        supplierId: row?.supplierId ?? "",
        payableBalance: row?.payableBalance ?? 0,
        prepaidBalance: row?.prepaidBalance ?? 0,
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
        formInline: (options.props as { formInline: SupplierBalanceForm })
          .formInline,
        isEdit: (options.props as { isEdit: boolean }).isEdit
      }),
    beforeSure: (done, { options }) => {
      const FormRef = dialogFormRef.value?.getRef();
      if (!FormRef) return;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          const cur = (options.props as { formInline: SupplierBalanceForm })
            .formInline;
          const date = cur.balanceDate || today();
          const tasks = [
            createInitialBalanceApi({
              type: PROVIDER_PAYABLE_TYPE,
              amount: toCents(cur.payableBalance),
              date,
              remark: cur.remark,
              providerId: cur.supplierId
            }),
            createInitialBalanceApi({
              type: PROVIDER_PREPAID_TYPE,
              amount: toCents(cur.prepaidBalance),
              date,
              remark: cur.remark,
              providerId: cur.supplierId
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

const handleDelete = async (row: SupplierBalance) => {
  const date = today();
  const [r1, r2] = await Promise.all([
    createInitialBalanceApi({
      type: PROVIDER_PAYABLE_TYPE,
      amount: 0,
      date,
      remark: "clear",
      providerId: row.supplierId
    }),
    createInitialBalanceApi({
      type: PROVIDER_PREPAID_TYPE,
      amount: 0,
      date,
      remark: "clear",
      providerId: row.supplierId
    })
  ]);
  if (r1.code === 200 && r2.code === 200) {
    message(`清空${row.supplierName}的期初余额成功`, { type: "success" });
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
        type: PROVIDER_PAYABLE_TYPE,
        amount: 0,
        date,
        remark: "clear",
        providerId: row.supplierId
      }),
      createInitialBalanceApi({
        type: PROVIDER_PREPAID_TYPE,
        amount: 0,
        date,
        remark: "clear",
        providerId: row.supplierId
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
          <el-statistic title="供应商数量" :value="statistics.supplierCount">
            <template #suffix>
              <span class="text-sm text-gray-400">个</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic
            title="期初应付总额"
            :value="statistics.totalPayable"
            :precision="2"
          >
            <template #prefix>
              <span class="text-red-500">&#165;</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic
            title="期初预付总额"
            :value="statistics.totalPrepaid"
            :precision="2"
          >
            <template #prefix>
              <span class="text-blue-500">&#165;</span>
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
      @reset="resetForm"
    >
      <el-form-item label="供应商名称：" prop="keyword">
        <el-input
          v-model="form.keyword"
          placeholder="请输入供应商名称/编码"
          clearable
          class="w-[200px]!"
        />
      </el-form-item>
      <el-form-item label="有余额：" prop="hasBalance">
        <el-select
          v-model="form.hasBalance"
          placeholder="全部"
          clearable
          class="w-[120px]!"
        >
          <el-option label="有应付" :value="true" />
          <el-option label="无余额" :value="false" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="供应商期初余额" @refresh="getList">
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
            <template #payableBalance="{ row }">
              <span
                :class="
                  row.payableBalance > 0
                    ? 'text-red-500 font-bold'
                    : 'text-gray-400'
                "
              >
                <MoneyDisplay
                  :value="row.payableBalance > 0 ? row.payableBalance : null"
                  :show-symbol="false"
                  empty-text="-"
                />
              </span>
            </template>
            <template #prepaidBalance="{ row }">
              <span
                :class="
                  row.prepaidBalance > 0
                    ? 'text-blue-500 font-bold'
                    : 'text-gray-400'
                "
              >
                <MoneyDisplay
                  :value="row.prepaidBalance > 0 ? row.prepaidBalance : null"
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
                :title="`确认删除${row.supplierName}的期初余额?`"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

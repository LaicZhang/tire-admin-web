<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils";
import { formatMoneyFromFen } from "@/utils/formatMoney";
import {
  approvePurchaseContractApi,
  convertPurchaseContractApi,
  createPurchaseContractApi,
  getPurchaseContractsApi,
  rejectPurchaseContractApi,
  submitPurchaseContractApi,
  terminatePurchaseContractApi,
  type Contract,
  type ContractStatus
} from "@/api/business/purchase-contract";

defineOptions({ name: "PurchaseContractManagement" });

const loading = ref(false);
const rows = ref<Contract[]>([]);
const page = reactive({ current: 1, total: 0, pageSize: 20 });
const filters = reactive<{ status?: ContractStatus; keyword?: string }>({});
const createVisible = ref(false);
const form = reactive({
  title: "",
  providerId: "",
  tireId: "",
  quantity: 1,
  unitPrice: 0,
  remark: ""
});
const convertForm = reactive({ storeId: "", repoId: "" });

const statusText: Record<ContractStatus, string> = {
  DRAFT: "草稿",
  PENDING_APPROVAL: "待审批",
  ACTIVE: "生效中",
  SUSPENDED: "已挂起",
  FULFILLED: "已履约",
  EXPIRED: "已过期",
  TERMINATED: "已终止",
  CANCELLED: "已取消"
};

function money(value: string | number | undefined | null) {
  if (value === undefined || value === null || value === "") return "-";
  try {
    return formatMoneyFromFen(BigInt(value));
  } catch {
    return String(value);
  }
}

function contractUid(row: unknown) {
  if (
    !row ||
    typeof row !== "object" ||
    !("uid" in row) ||
    typeof row.uid !== "string"
  ) {
    throw new Error("合同 UID 缺失");
  }
  return row.uid;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getPurchaseContractsApi(page.current, {
      status: filters.status,
      keyword: filters.keyword
    });
    rows.value = res.data?.list ?? [];
    page.total = res.data?.count ?? 0;
    page.pageSize = res.data?.pageSize ?? 20;
  } finally {
    loading.value = false;
  }
}

async function createContract() {
  if (!form.title.trim() || !form.providerId.trim()) {
    message("标题和供应商不能为空", { type: "warning" });
    return;
  }
  await createPurchaseContractApi({
    title: form.title.trim(),
    providerId: form.providerId.trim(),
    remark: form.remark || undefined,
    details: [
      {
        tireId: form.tireId.trim() || undefined,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
        skuName: form.tireId ? undefined : "合同商品"
      }
    ]
  });
  message("采购合同已创建", { type: "success" });
  createVisible.value = false;
  await loadData();
}

async function submit(row: unknown) {
  await submitPurchaseContractApi(contractUid(row));
  message("已提交审批", { type: "success" });
  await loadData();
}

async function approve(row: unknown) {
  await ElMessageBox.confirm("确认通过该采购合同？", "审批");
  await approvePurchaseContractApi(contractUid(row));
  message("已通过", { type: "success" });
  await loadData();
}

async function reject(row: unknown) {
  const { value } = await ElMessageBox.prompt("请输入驳回原因", "驳回合同", {
    inputPattern: /\S+/,
    inputErrorMessage: "原因不能为空"
  });
  await rejectPurchaseContractApi(contractUid(row), value);
  message("已驳回", { type: "success" });
  await loadData();
}

async function terminate(row: unknown) {
  const { value } = await ElMessageBox.prompt("请输入终止原因", "终止合同", {
    inputPattern: /\S+/,
    inputErrorMessage: "原因不能为空"
  });
  await terminatePurchaseContractApi(contractUid(row), value);
  message("合同已终止", { type: "success" });
  await loadData();
}

async function convertOrder(row: unknown) {
  if (!convertForm.storeId.trim() || !convertForm.repoId.trim()) {
    message("请填写门店与仓库", { type: "warning" });
    return;
  }
  const res = await convertPurchaseContractApi(contractUid(row), {
    storeId: convertForm.storeId.trim(),
    repoId: convertForm.repoId.trim()
  });
  message(`已生成草稿采购单 ${res.data?.orderUid ?? ""}`, { type: "success" });
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <el-input
        v-model="filters.keyword"
        clearable
        placeholder="合同号/标题"
        class="!w-48"
        @keyup.enter="loadData"
      />
      <el-select
        v-model="filters.status"
        clearable
        placeholder="状态"
        class="!w-40"
      >
        <el-option
          v-for="(label, key) in statusText"
          :key="key"
          :label="label"
          :value="key"
        />
      </el-select>
      <el-button type="primary" @click="loadData">查询</el-button>
      <Auth value="post/purchase-contract">
        <el-button type="success" @click="createVisible = true">新建</el-button>
      </Auth>
    </div>

    <div class="mb-3 flex flex-wrap gap-2 text-sm text-gray-500">
      <span>转单门店</span>
      <el-input
        v-model="convertForm.storeId"
        placeholder="storeId"
        class="!w-56"
      />
      <span>仓库</span>
      <el-input
        v-model="convertForm.repoId"
        placeholder="repoId"
        class="!w-56"
      />
    </div>

    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="contractNo" label="合同号" min-width="140" />
      <el-table-column prop="title" label="标题" min-width="160" />
      <el-table-column label="供应商" min-width="120">
        <template #default="{ row }">
          {{ row.provider?.name || row.providerId || "-" }}
        </template>
      </el-table-column>
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          {{ money(row.totalAmount) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          {{ statusText[row.status as ContractStatus] || row.status }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="320" fixed="right">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-1">
            <Auth
              v-if="row.status === 'DRAFT'"
              value="post/purchase-contract/:uid/submit"
            >
              <el-button size="small" @click="submit(row)">提交</el-button>
            </Auth>
            <Auth
              v-if="row.status === 'PENDING_APPROVAL'"
              value="post/purchase-contract/:uid/approve"
            >
              <el-button size="small" type="success" @click="approve(row)"
                >通过</el-button
              >
            </Auth>
            <Auth
              v-if="row.status === 'PENDING_APPROVAL'"
              value="post/purchase-contract/:uid/reject"
            >
              <el-button size="small" type="warning" @click="reject(row)"
                >驳回</el-button
              >
            </Auth>
            <Auth
              v-if="row.status === 'ACTIVE'"
              value="post/purchase-contract/:uid/convert-order"
            >
              <el-button size="small" type="primary" @click="convertOrder(row)"
                >转订单</el-button
              >
            </Auth>
            <Auth
              v-if="row.status === 'ACTIVE' || row.status === 'SUSPENDED'"
              value="post/purchase-contract/:uid/terminate"
            >
              <el-button size="small" type="danger" @click="terminate(row)"
                >终止</el-button
              >
            </Auth>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="page.current"
        :page-size="page.pageSize"
        :total="page.total"
        layout="total, prev, pager, next"
        @current-change="loadData"
      />
    </div>

    <el-dialog v-model="createVisible" title="新建采购合同" width="520px">
      <el-form label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="供应商ID" required>
          <el-input v-model="form.providerId" />
        </el-form-item>
        <el-form-item label="商品ID">
          <el-input v-model="form.tireId" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="form.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="单价(分)">
          <el-input-number v-model="form.unitPrice" :min="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="createContract">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

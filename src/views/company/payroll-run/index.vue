<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils";
import { formatMoneyFromFen } from "@/utils/formatMoney";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";
import {
  accruePayrollRunApi,
  confirmPayrollRunApi,
  disbursePayrollRunApi,
  generatePayrollRunApi,
  getPayrollRunApi,
  listPayrollRunsApi,
  recalculatePayrollRunApi,
  reversePayrollRunApi,
  unconfirmPayrollRunApi,
  updatePayrollLineInputsApi,
  type PayrollRun,
  type PayrollRunStatus
} from "@/api/company/payroll-run";
import { dispatchPayslipsApi } from "@/api/company/payslip";

defineOptions({ name: "PayrollRunManagement" });

const loading = ref(false);
const runs = ref<PayrollRun[]>([]);
const current = ref<PayrollRun | null>(null);
const period = ref<number>(
  Number(
    `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`
  )
);
const disburse = reactive({
  visible: false,
  paymentId: "" as string | undefined,
  amountYuan: ""
});

const statusText: Record<PayrollRunStatus, string> = {
  DRAFT: "草稿",
  CONFIRMED: "已确认",
  ACCRUED: "已计提",
  PAID: "已发放",
  REVERSED: "已红冲"
};

const itemCodes = computed(() => {
  const set = new Set<string>();
  for (const line of current.value?.lines ?? []) {
    for (const it of line.items ?? []) set.add(it.code);
  }
  return Array.from(set);
});

function money(v: string | number | null | undefined) {
  try {
    return formatMoneyFromFen(BigInt(String(v ?? "0")));
  } catch {
    return "0.00";
  }
}

function fenOf(v: string | number | null | undefined) {
  return Number(String(v ?? "0"));
}

async function loadRuns() {
  loading.value = true;
  try {
    const res = await listPayrollRunsApi({ period: period.value || undefined });
    runs.value = res.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function openRun(uid: string) {
  loading.value = true;
  try {
    const res = await getPayrollRunApi(uid);
    current.value = res.data ?? null;
  } finally {
    loading.value = false;
  }
}

async function generate() {
  if (!period.value) {
    message("请输入期间 YYYYMM", { type: "warning" });
    return;
  }
  loading.value = true;
  try {
    const res = await generatePayrollRunApi({
      period: period.value,
      copyFromPrevious: true
    });
    message("工资表已生成", { type: "success" });
    await loadRuns();
    if (res.data?.uid) await openRun(res.data.uid);
  } catch (e) {
    // surface conflict employeeIds via default error handler
    throw e;
  } finally {
    loading.value = false;
  }
}

async function saveInput(lineUid: string, code: string, raw: string | number) {
  if (!current.value || current.value.status !== "DRAFT") return;
  const amount = Math.round(Number(raw));
  if (!Number.isFinite(amount)) return;
  loading.value = true;
  try {
    const res = await updatePayrollLineInputsApi(current.value.uid, lineUid, {
      [code]: amount
    });
    current.value = res.data ?? current.value;
  } finally {
    loading.value = false;
  }
}

async function act(
  action: "recalc" | "confirm" | "unconfirm" | "accrue" | "payslip"
) {
  if (!current.value) return;
  const uid = current.value.uid;
  loading.value = true;
  try {
    if (action === "recalc") await recalculatePayrollRunApi(uid);
    if (action === "confirm") await confirmPayrollRunApi(uid);
    if (action === "unconfirm") await unconfirmPayrollRunApi(uid);
    if (action === "accrue") await accruePayrollRunApi(uid, "计提");
    if (action === "payslip") {
      const report = await dispatchPayslipsApi(uid);
      message(
        `工资条：站内${report.data?.successInApp ?? 0}/邮件${report.data?.successEmail ?? 0}/无邮箱${report.data?.skippedNoEmail ?? 0}`,
        { type: "success" }
      );
    }
    await openRun(uid);
    await loadRuns();
  } finally {
    loading.value = false;
  }
}

function openDisburse() {
  if (!current.value) return;
  disburse.paymentId = undefined;
  disburse.amountYuan = money(current.value.totalActual);
  disburse.visible = true;
}

async function submitDisburse() {
  if (!current.value || !disburse.paymentId) {
    message("请选择资金账户", { type: "warning" });
    return;
  }
  const amountFen = Math.round(Number(disburse.amountYuan) * 100);
  loading.value = true;
  try {
    await disbursePayrollRunApi(current.value.uid, {
      paymentId: disburse.paymentId,
      amount: amountFen,
      reason: "工资发放"
    });
    message("已发放并扣减资金", { type: "success" });
    disburse.visible = false;
    await openRun(current.value.uid);
    await loadRuns();
  } finally {
    loading.value = false;
  }
}

async function reverseRun() {
  if (!current.value) return;
  const { value } = await ElMessageBox.prompt("请输入红冲原因", "红冲工资表", {
    inputPattern: /\S+/,
    inputErrorMessage: "原因不能为空"
  });
  loading.value = true;
  try {
    await reversePayrollRunApi(current.value.uid, value);
    message("已红冲", { type: "success" });
    await openRun(current.value.uid);
    await loadRuns();
  } finally {
    loading.value = false;
  }
}

onMounted(loadRuns);
</script>

<template>
  <div class="p-4">
    <el-card class="mb-3">
      <el-form inline>
        <el-form-item label="期间 YYYYMM">
          <el-input-number
            v-model="period"
            :controls="false"
            class="w-[140px]"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="loadRuns">查询</el-button>
          <el-button type="primary" @click="generate">生成工资表</el-button>
        </el-form-item>
      </el-form>
      <el-table
        v-loading="loading"
        :data="runs"
        border
        highlight-current-row
        @row-click="(row: PayrollRun) => openRun(row.uid)"
      >
        <el-table-column prop="period" label="期间" width="100" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            {{ statusText[row.status as PayrollRunStatus] || row.status }}
          </template>
        </el-table-column>
        <el-table-column label="人数" width="80">
          <template #default="{ row }">{{
            row._count?.lines ?? row.lines?.length ?? "-"
          }}</template>
        </el-table-column>
        <el-table-column label="应发合计">
          <template #default="{ row }">¥{{ money(row.totalPayable) }}</template>
        </el-table-column>
        <el-table-column label="实发合计">
          <template #default="{ row }">¥{{ money(row.totalActual) }}</template>
        </el-table-column>
        <el-table-column label="公司成本">
          <template #default="{ row }"
            >¥{{ money(row.totalEmployer) }}</template
          >
        </el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="current" v-loading="loading">
      <template #header>
        <div class="flex flex-wrap items-center gap-2 justify-between">
          <div>
            <strong>{{ current.period }}</strong>
            · {{ statusText[current.status] }} · 应发 ¥{{
              money(current.totalPayable)
            }}
            · 实发 ¥{{ money(current.totalActual) }}
          </div>
          <div class="flex flex-wrap gap-2">
            <el-button v-if="current.status === 'DRAFT'" @click="act('recalc')"
              >重算</el-button
            >
            <el-button
              v-if="current.status === 'DRAFT'"
              type="primary"
              @click="act('confirm')"
              >确认</el-button
            >
            <el-button
              v-if="current.status === 'CONFIRMED'"
              @click="act('unconfirm')"
              >反确认</el-button
            >
            <el-button
              v-if="current.status === 'CONFIRMED'"
              type="warning"
              @click="act('accrue')"
              >计提</el-button
            >
            <el-button
              v-if="current.status === 'ACCRUED'"
              type="success"
              @click="openDisburse"
              >发放</el-button
            >
            <el-button
              v-if="['CONFIRMED', 'ACCRUED', 'PAID'].includes(current.status)"
              @click="act('payslip')"
              >发送工资条</el-button
            >
            <el-button
              v-if="current.status === 'ACCRUED' || current.status === 'PAID'"
              type="danger"
              @click="reverseRun"
              >红冲</el-button
            >
          </div>
        </div>
      </template>

      <el-table :data="current.lines ?? []" border height="520">
        <el-table-column label="员工" fixed width="140">
          <template #default="{ row }">
            {{ row.employee?.name || row.employee?.nickname || row.employeeId }}
          </template>
        </el-table-column>
        <el-table-column
          v-for="code in itemCodes"
          :key="code"
          :label="code"
          min-width="110"
        >
          <template #default="{ row }">
            <template v-if="current?.status === 'DRAFT'">
              <el-input
                v-if="
                  row.items?.find((i: any) => i.code === code)?.calcKind ===
                  'INPUT'
                "
                :model-value="
                  fenOf(row.items?.find((i: any) => i.code === code)?.amount)
                "
                size="small"
                @change="(v: string) => saveInput(row.uid, code, v)"
              />
              <span v-else
                >¥{{
                  money(row.items?.find((i: any) => i.code === code)?.amount)
                }}</span
              >
            </template>
            <span v-else
              >¥{{
                money(row.items?.find((i: any) => i.code === code)?.amount)
              }}</span
            >
          </template>
        </el-table-column>
        <el-table-column label="应发" width="110" fixed="right">
          <template #default="{ row }">¥{{ money(row.payableWages) }}</template>
        </el-table-column>
        <el-table-column label="实发" width="110" fixed="right">
          <template #default="{ row }">¥{{ money(row.actualWages) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="disburse.visible" title="发放工资" width="480px">
      <el-form label-width="100px">
        <el-form-item label="资金账户" required>
          <PaymentSelect v-model="disburse.paymentId" class="w-full" />
        </el-form-item>
        <el-form-item label="金额(元)">
          <el-input v-model="disburse.amountYuan" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disburse.visible = false">取消</el-button>
        <el-button type="primary" @click="submitDisburse">确认发放</el-button>
      </template>
    </el-dialog>
  </div>
</template>

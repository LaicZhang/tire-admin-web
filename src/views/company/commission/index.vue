<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils";
import { formatMoneyFromFen } from "@/utils/formatMoney";
import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";
import {
  approveCommissionSettlementApi,
  createCommissionSettlementApi,
  exportCommissionRecordsApi,
  getCommissionRecordsApi,
  getCommissionSettlementsApi,
  getCommissionSummaryApi,
  mergeCommissionIntoPayrollApi,
  payCommissionImmediateApi,
  rejectCommissionSettlementApi,
  reverseCommissionSettlementApi,
  submitCommissionSettlementApi,
  type CommissionPayoutMode,
  type CommissionRecord,
  type CommissionRecordStatus,
  type CommissionSettlement,
  type CommissionSummary
} from "@/api/company/commission";

defineOptions({ name: "CommissionManagement" });

const activeTab = ref("records");
const loading = ref(false);
const records = ref<CommissionRecord[]>([]);
const summaries = ref<CommissionSummary[]>([]);
const settlements = ref<CommissionSettlement[]>([]);
const recordPage = reactive({ current: 1, total: 0, pageSize: 20 });
const settlementPage = reactive({ current: 1, total: 0, pageSize: 20 });
const filters = reactive<{
  salespersonId?: string;
  saleOrderId?: string;
  status?: CommissionRecordStatus;
}>({});
const settlementForm = reactive<{
  salespersonId: string;
  remark: string;
  payoutMode: CommissionPayoutMode;
}>({
  salespersonId: "",
  remark: "",
  payoutMode: "PAYROLL"
});
const mergeDialog = reactive({
  visible: false,
  uid: "",
  payrollRunId: ""
});
const immediateDialog = reactive({
  visible: false,
  uid: "",
  paymentId: "" as string | undefined
});

const statusText: Record<string, string> = {
  ESTIMATED: "预计",
  AVAILABLE: "可结算",
  SETTLED: "已结算",
  REVERSED: "已冲销",
  DRAFT: "草稿",
  PENDING_APPROVAL: "待审核",
  APPROVED: "已审核"
};

const payoutModeText: Record<CommissionPayoutMode, string> = {
  PAYROLL: "并入工资表",
  IMMEDIATE: "立即出账"
};

function money(value: string | null | undefined) {
  return formatMoneyFromFen(BigInt(value || "0"));
}

async function loadRecords() {
  loading.value = true;
  try {
    const [recordRes, summaryRes] = await Promise.all([
      getCommissionRecordsApi(recordPage.current, {
        salespersonId: filters.salespersonId || undefined,
        saleOrderId: filters.saleOrderId || undefined,
        status: filters.status
      }),
      getCommissionSummaryApi({
        saleOrderId: filters.saleOrderId || undefined,
        status: filters.status
      })
    ]);
    records.value = recordRes.data?.list ?? [];
    recordPage.total = recordRes.data?.count ?? 0;
    recordPage.pageSize = recordRes.data?.pageSize ?? 20;
    summaries.value = summaryRes.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function exportRecords() {
  const blob = await exportCommissionRecordsApi({
    salespersonId: filters.salespersonId || undefined,
    saleOrderId: filters.saleOrderId || undefined,
    status: filters.status
  });
  downloadBlob(
    blob,
    generateFilenameWithTimestamp("commission-records", ".xlsx")
  );
}

async function loadSettlements() {
  loading.value = true;
  try {
    const res = await getCommissionSettlementsApi(settlementPage.current);
    settlements.value = res.data?.list ?? [];
    settlementPage.total = res.data?.count ?? 0;
    settlementPage.pageSize = res.data?.pageSize ?? 20;
  } finally {
    loading.value = false;
  }
}

async function createSettlement() {
  const salespersonId = settlementForm.salespersonId.trim();
  if (!salespersonId) {
    message("请输入销售员 UID", { type: "warning" });
    return;
  }
  if (
    settlementForm.payoutMode !== "PAYROLL" &&
    settlementForm.payoutMode !== "IMMEDIATE"
  ) {
    message("请选出账方式", { type: "warning" });
    return;
  }
  await createCommissionSettlementApi({
    salespersonId,
    payoutMode: settlementForm.payoutMode,
    remark: settlementForm.remark.trim() || undefined
  });
  message("提成结算草稿已创建", { type: "success" });
  settlementForm.remark = "";
  await loadSettlements();
}

function getSettlementUid(row: unknown) {
  if (
    !row ||
    typeof row !== "object" ||
    !("uid" in row) ||
    typeof row.uid !== "string"
  ) {
    throw new Error("提成结算单 UID 缺失");
  }
  return row.uid;
}

async function submitSettlement(row: unknown) {
  const uid = getSettlementUid(row);
  await ElMessageBox.confirm("确认提交该提成结算单审核？", "提交审核");
  await submitCommissionSettlementApi(uid);
  message("已提交审核", { type: "success" });
  await loadSettlements();
}

async function approveSettlement(row: unknown) {
  const uid = getSettlementUid(row);
  await ElMessageBox.confirm(
    "审核后提成将正式入账（PAYROLL 不扣款，IMMEDIATE 需再出账），是否继续？",
    "审核提成"
  );
  await approveCommissionSettlementApi(uid);
  message("提成结算已审核入账", { type: "success" });
  await Promise.all([loadSettlements(), loadRecords()]);
}

async function reverseSettlement(row: unknown) {
  const uid = getSettlementUid(row);
  const result = await ElMessageBox.prompt("请输入冲销原因", "冲销提成结算", {
    inputValidator: value => Boolean(value?.trim()) || "冲销原因不能为空"
  });
  await reverseCommissionSettlementApi(uid, result.value.trim());
  message("提成结算已冲销", { type: "success" });
  await Promise.all([loadSettlements(), loadRecords()]);
}

async function rejectSettlement(row: unknown) {
  const uid = getSettlementUid(row);
  const result = await ElMessageBox.prompt("请输入拒审原因", "拒审提成结算", {
    inputValidator: value => Boolean(value?.trim()) || "拒审原因不能为空"
  });
  await rejectCommissionSettlementApi(uid, result.value.trim());
  message("已拒审并退回草稿", { type: "success" });
  await loadSettlements();
}

function openMerge(row: CommissionSettlement) {
  mergeDialog.uid = row.uid;
  mergeDialog.payrollRunId = "";
  mergeDialog.visible = true;
}

async function confirmMerge() {
  const runId = mergeDialog.payrollRunId.trim();
  if (!runId) {
    message("请输入目标工资表 Run UID", { type: "warning" });
    return;
  }
  await mergeCommissionIntoPayrollApi(mergeDialog.uid, runId);
  message("已并入工资表", { type: "success" });
  mergeDialog.visible = false;
  await loadSettlements();
}

function openImmediate(row: CommissionSettlement) {
  immediateDialog.uid = row.uid;
  immediateDialog.paymentId = undefined;
  immediateDialog.visible = true;
}

async function confirmImmediate() {
  if (!immediateDialog.paymentId) {
    message("请选择资金账户", { type: "warning" });
    return;
  }
  await payCommissionImmediateApi(
    immediateDialog.uid,
    immediateDialog.paymentId
  );
  message("立即出账完成", { type: "success" });
  immediateDialog.visible = false;
  await loadSettlements();
}

function payoutLinkLabel(row: CommissionSettlement) {
  const link = row.payoutLink;
  if (!link) return "—";
  if (link.payrollRunId) return `工资表 ${link.payrollRunId.slice(0, 8)}…`;
  if (link.otherExpenseOrderUid)
    return `支出单 ${link.otherExpenseOrderUid.slice(0, 8)}…`;
  return "已关联";
}

function onTabChange(name: string | number) {
  if (name === "settlements") loadSettlements();
}

onMounted(() => {
  loadRecords();
  loadSettlements();
});
</script>

<template>
  <div class="main">
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="提成明细" name="records">
        <el-card class="mb-3">
          <el-form inline>
            <el-form-item label="销售员 UID">
              <el-input v-model="filters.salespersonId" clearable />
            </el-form-item>
            <el-form-item label="销售订单 UID">
              <el-input v-model="filters.saleOrderId" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filters.status" clearable class="w-[140px]">
                <el-option label="预计" value="ESTIMATED" />
                <el-option label="可结算" value="AVAILABLE" />
                <el-option label="已结算" value="SETTLED" />
                <el-option label="已冲销" value="REVERSED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="
                  recordPage.current = 1;
                  loadRecords();
                "
              >
                查询
              </el-button>
            </el-form-item>
            <el-form-item>
              <Auth value="get/commission/records/export">
                <el-button @click="exportRecords">导出提成</el-button>
              </Auth>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="mb-3">
          <template #header>按销售员汇总</template>
          <el-table :data="summaries" border>
            <el-table-column
              prop="salespersonId"
              label="销售员 UID"
              min-width="220"
            />
            <el-table-column label="记录数" width="100">
              <template #default="{ row }">{{
                row._count?._all ?? 0
              }}</template>
            </el-table-column>
            <el-table-column label="预计合计" width="140">
              <template #default="{ row }"
                >¥{{ money(row._sum?.estimatedAmount) }}</template
              >
            </el-table-column>
            <el-table-column label="可结算合计" width="140">
              <template #default="{ row }"
                >¥{{ money(row._sum?.availableAmount) }}</template
              >
            </el-table-column>
            <el-table-column label="已结算合计" width="140">
              <template #default="{ row }"
                >¥{{ money(row._sum?.settledAmount) }}</template
              >
            </el-table-column>
          </el-table>
        </el-card>

        <el-card>
          <el-table v-loading="loading" :data="records" border>
            <el-table-column
              prop="createdAt"
              label="创建时间"
              min-width="180"
            />
            <el-table-column
              prop="salespersonId"
              label="销售员 UID"
              min-width="220"
            />
            <el-table-column
              prop="saleOrderId"
              label="销售订单 UID"
              min-width="220"
            />
            <el-table-column
              prop="shippedQuantity"
              label="实发数量"
              width="100"
            />
            <el-table-column label="提成基数" width="130">
              <template #default="{ row }"
                >¥{{ money(row.commissionBaseAmount) }}</template
              >
            </el-table-column>
            <el-table-column label="预计提成" width="130">
              <template #default="{ row }"
                >¥{{ money(row.estimatedAmount) }}</template
              >
            </el-table-column>
            <el-table-column label="可结算" width="130">
              <template #default="{ row }"
                >¥{{ money(row.availableAmount) }}</template
              >
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">{{
                statusText[row.status] || row.status
              }}</template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="recordPage.current"
            class="mt-3 justify-end"
            :page-size="recordPage.pageSize"
            :total="recordPage.total"
            @current-change="loadRecords"
          />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="提成结算" name="settlements">
        <el-card class="mb-3">
          <el-form inline>
            <el-form-item label="销售员 UID">
              <el-input
                v-model="settlementForm.salespersonId"
                class="w-[320px]"
              />
            </el-form-item>
            <el-form-item label="出账方式">
              <el-radio-group v-model="settlementForm.payoutMode">
                <el-radio-button value="PAYROLL">并入工资表</el-radio-button>
                <el-radio-button value="IMMEDIATE">立即出账</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="settlementForm.remark" class="w-[260px]" />
            </el-form-item>
            <el-form-item>
              <Auth value="post/commission/settlements">
                <el-button type="primary" @click="createSettlement"
                  >生成结算草稿</el-button
                >
              </Auth>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card>
          <el-table v-loading="loading" :data="settlements" border>
            <el-table-column
              prop="createdAt"
              label="创建时间"
              min-width="180"
            />
            <el-table-column
              prop="salespersonId"
              label="销售员 UID"
              min-width="220"
            />
            <el-table-column label="出账方式" width="120">
              <template #default="{ row }">{{
                payoutModeText[row.payoutMode as CommissionPayoutMode] ||
                row.payoutMode
              }}</template>
            </el-table-column>
            <el-table-column label="结算金额" width="140">
              <template #default="{ row }"
                >¥{{ money(row.totalAmount) }}</template
              >
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">{{
                statusText[row.status] || row.status
              }}</template>
            </el-table-column>
            <el-table-column label="出账关联" min-width="180">
              <template #default="{ row }">{{ payoutLinkLabel(row) }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" />
            <el-table-column label="操作" width="360" fixed="right">
              <template #default="{ row }">
                <Auth value="post/commission/settlements/:uid/submit">
                  <el-button
                    v-if="row.status === 'DRAFT'"
                    link
                    type="primary"
                    @click="submitSettlement(row)"
                  >
                    提交审核
                  </el-button>
                </Auth>
                <Auth value="post/commission/settlements/:uid/approve">
                  <el-button
                    v-if="row.status === 'PENDING_APPROVAL'"
                    link
                    type="success"
                    @click="approveSettlement(row)"
                  >
                    审核入账
                  </el-button>
                </Auth>
                <Auth value="post/commission/settlements/:uid/reject">
                  <el-button
                    v-if="row.status === 'PENDING_APPROVAL'"
                    link
                    type="warning"
                    @click="rejectSettlement(row)"
                  >
                    拒审
                  </el-button>
                </Auth>
                <Auth value="post/commission/settlements/:uid/merge-payroll">
                  <el-button
                    v-if="
                      row.status === 'APPROVED' &&
                      row.payoutMode === 'PAYROLL' &&
                      !row.payoutLink
                    "
                    link
                    type="primary"
                    @click="openMerge(row)"
                  >
                    并入工资表
                  </el-button>
                </Auth>
                <Auth value="post/commission/settlements/:uid/pay-immediate">
                  <el-button
                    v-if="
                      row.status === 'APPROVED' &&
                      row.payoutMode === 'IMMEDIATE' &&
                      !row.payoutLink
                    "
                    link
                    type="success"
                    @click="openImmediate(row)"
                  >
                    立即出账
                  </el-button>
                </Auth>
                <Auth value="post/commission/settlements/:uid/reverse">
                  <el-button
                    v-if="row.status === 'APPROVED'"
                    link
                    type="danger"
                    @click="reverseSettlement(row)"
                  >
                    冲销
                  </el-button>
                </Auth>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="settlementPage.current"
            class="mt-3 justify-end"
            :page-size="settlementPage.pageSize"
            :total="settlementPage.total"
            @current-change="loadSettlements"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="mergeDialog.visible" title="并入工资表" width="480px">
      <el-form label-width="120px">
        <el-form-item label="工资表 Run UID">
          <el-input
            v-model="mergeDialog.payrollRunId"
            placeholder="DRAFT 工资表 uid"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mergeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmMerge">确认并入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="immediateDialog.visible" title="立即出账" width="480px">
      <el-form label-width="100px">
        <el-form-item label="资金账户">
          <PaymentSelect v-model="immediateDialog.paymentId" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="immediateDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmImmediate">确认出账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

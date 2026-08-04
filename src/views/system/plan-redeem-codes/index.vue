<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import Refresh from "~icons/ep/refresh";
import { ElMessageBox } from "element-plus";
import { handleApiError, message } from "@/utils";
import {
  createPlanRedeemCodeApi,
  listPlanRedeemCodesApi,
  listSubscriptionPlansApi,
  revokePlanRedeemCodeApi,
  type PlanRedeemCode,
  type PlanRedeemCodeStatus,
  type SubscriptionPlan,
  type SubscriptionPlanCode
} from "@/api/system/subscription";

defineOptions({
  name: "SystemPlanRedeemCodes"
});

const PLAN_CODE_OPTIONS: Array<{ label: string; value: SubscriptionPlanCode }> =
  [
    { label: "免费计划 FREE", value: "FREE" },
    { label: "高级 PREMIUM", value: "PREMIUM" },
    { label: "买断 BUYOUT", value: "BUYOUT" }
  ];

const STATUS_OPTIONS: Array<{
  label: string;
  value: PlanRedeemCodeStatus | "";
}> = [
  { label: "全部状态", value: "" },
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "EXHAUSTED", value: "EXHAUSTED" },
  { label: "EXPIRED", value: "EXPIRED" },
  { label: "REVOKED", value: "REVOKED" }
];

const loading = ref(false);
const codes = ref<PlanRedeemCode[]>([]);
const plans = ref<SubscriptionPlan[]>([]);
const createVisible = ref(false);
const createdPreview = ref<PlanRedeemCode | null>(null);

const filter = reactive({
  planCode: "" as SubscriptionPlanCode | "",
  status: "" as PlanRedeemCodeStatus | ""
});

const form = reactive({
  planCode: "PREMIUM" as SubscriptionPlanCode,
  maxUses: 1,
  expiresAt: "" as string,
  boundCompanyId: "",
  note: "",
  code: ""
});

const columns: TableColumnList = [
  { label: "兑换码", prop: "code", minWidth: 160 },
  {
    label: "计划",
    prop: "plan",
    minWidth: 120,
    formatter: ({ plan, planId }) =>
      plan ? `${plan.code} · ${plan.name}` : planId || "—"
  },
  {
    label: "用量",
    prop: "usedCount",
    width: 100,
    formatter: ({ usedCount, maxUses }) => `${usedCount ?? 0} / ${maxUses ?? 0}`
  },
  {
    label: "过期",
    prop: "expiresAt",
    minWidth: 160,
    formatter: ({ expiresAt }) =>
      expiresAt
        ? String(expiresAt).replace("T", " ").substring(0, 19)
        : "不过期"
  },
  {
    label: "绑定公司",
    prop: "boundCompanyId",
    minWidth: 140,
    formatter: ({ boundCompanyId }) => boundCompanyId || "不限"
  },
  { label: "状态", prop: "status", width: 110, slot: "status" },
  {
    label: "备注",
    prop: "note",
    minWidth: 120,
    formatter: ({ note }) => note || "—"
  },
  {
    label: "创建",
    prop: "createAt",
    minWidth: 160,
    formatter: ({ createAt }) =>
      createAt ? String(createAt).replace("T", " ").substring(0, 19) : "—"
  },
  { label: "操作", fixed: "right", width: 120, slot: "operation" }
];

function statusTagType(
  status: PlanRedeemCodeStatus
): "success" | "info" | "warning" | "danger" {
  if (status === "ACTIVE") return "success";
  if (status === "EXHAUSTED") return "warning";
  if (status === "EXPIRED") return "info";
  return "danger";
}

async function loadData() {
  loading.value = true;
  try {
    const params: {
      planCode?: SubscriptionPlanCode;
      status?: PlanRedeemCodeStatus;
    } = {};
    if (filter.planCode) params.planCode = filter.planCode;
    if (filter.status) params.status = filter.status;
    const { code, data, msg } = await listPlanRedeemCodesApi(params);
    if (code === 200) {
      codes.value = Array.isArray(data) ? data : [];
    } else {
      message(msg || "加载兑换码失败", { type: "error" });
      codes.value = [];
    }
  } catch (error) {
    codes.value = [];
    handleApiError(error, "加载兑换码失败");
  } finally {
    loading.value = false;
  }
}

async function loadPlans() {
  try {
    const { code, data } = await listSubscriptionPlansApi();
    if (code === 200 && Array.isArray(data)) {
      plans.value = data;
    }
  } catch {
    // non-blocking
  }
}

function openCreate() {
  form.planCode = "PREMIUM";
  form.maxUses = 1;
  form.expiresAt = "";
  form.boundCompanyId = "";
  form.note = "";
  form.code = "";
  createdPreview.value = null;
  createVisible.value = true;
}

async function submitCreate() {
  loading.value = true;
  try {
    const expiresAt = form.expiresAt
      ? new Date(form.expiresAt.replace(" ", "T")).toISOString()
      : undefined;
    const payload = {
      planCode: form.planCode,
      maxUses: form.maxUses > 0 ? form.maxUses : 1,
      expiresAt,
      boundCompanyId: form.boundCompanyId.trim() || undefined,
      note: form.note.trim() || undefined,
      code: form.code.trim() || undefined
    };
    const { code, data, msg } = await createPlanRedeemCodeApi(payload);
    if (code !== 200) {
      message(msg || "发行失败", { type: "error" });
      return;
    }
    createdPreview.value = data ?? null;
    message("兑换码已发行（无在线购买；Boss 可在公司侧兑换）", {
      type: "success"
    });
    await loadData();
  } catch (error) {
    handleApiError(error, "发行兑换码失败");
  } finally {
    loading.value = false;
  }
}

async function handleRevoke(row: PlanRedeemCode) {
  try {
    await ElMessageBox.confirm(
      `作废兑换码「${row.code}」后不可再兑换。确认？`,
      "作废兑换码",
      { type: "warning", confirmButtonText: "作废", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  loading.value = true;
  try {
    const { code, msg } = await revokePlanRedeemCodeApi(row.uid);
    if (code !== 200) {
      message(msg || "作废失败", { type: "error" });
      return;
    }
    message("已作废", { type: "success" });
    await loadData();
  } catch (error) {
    handleApiError(error, "作废兑换码失败");
  } finally {
    loading.value = false;
  }
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    message("已复制兑换码", { type: "success" });
  } catch {
    message(`请手动复制：${code}`, { type: "info" });
  }
}

onMounted(() => {
  loadPlans();
  loadData();
});
</script>

<template>
  <div class="main p-4">
    <div class="bg-white p-4 rounded-md mb-3 text-sm text-gray-600">
      兑换码用于平台运营发放订阅计划（含「免费计划」），与「免费账套导入」无关；本页无购买入口。Boss
      在公司侧兑换（W133）。
    </div>
    <div class="bg-white p-4 rounded-md">
      <div class="flex flex-wrap gap-3 mb-3 items-center">
        <el-select
          v-model="filter.planCode"
          clearable
          placeholder="计划代码"
          class="w-[160px]"
          @change="loadData"
        >
          <el-option label="全部计划" value="" />
          <el-option
            v-for="opt in PLAN_CODE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="filter.status"
          clearable
          placeholder="状态"
          class="w-[140px]"
          @change="loadData"
        >
          <el-option
            v-for="opt in STATUS_OPTIONS"
            :key="opt.label"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
      <PureTableBar title="计划兑换码" :columns="columns" @refresh="loadData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openCreate"
          >
            发行兑换码
          </el-button>
          <el-button
            :icon="useRenderIcon(Refresh)"
            :loading="loading"
            @click="loadData"
          >
            刷新
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            border
            row-key="uid"
            align-whole="center"
            showOverflowTooltip
            :loading="loading"
            :size="size"
            :data="codes"
            :columns="dynamicColumns"
          >
            <template #status="{ row }">
              <el-tag :type="statusTagType(row.status)" effect="plain">
                {{ row.status }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-button
                link
                type="primary"
                :size="size"
                @click="copyCode(row.code)"
              >
                复制
              </el-button>
              <el-button
                v-if="row.status === 'ACTIVE'"
                link
                type="danger"
                :size="size"
                @click="handleRevoke(row)"
              >
                作废
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>

    <el-dialog
      v-model="createVisible"
      title="发行计划兑换码"
      width="520px"
      destroy-on-close
    >
      <el-alert
        v-if="createdPreview"
        type="success"
        :closable="false"
        class="mb-3"
        :title="`已发行：${createdPreview.code}`"
        description="请妥善保存并线下交付；列表中可再次复制。"
      />
      <el-form label-width="120px">
        <el-form-item label="计划代码" required>
          <el-select v-model="form.planCode" class="w-full">
            <el-option
              v-for="opt in PLAN_CODE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <div v-if="plans.length" class="text-xs text-gray-500 mt-1">
            当前目录：
            {{
              plans.map(p => `${p.code}(${p.status ? "启" : "停"})`).join(" · ")
            }}
          </div>
        </el-form-item>
        <el-form-item label="最大使用次数">
          <el-input-number v-model="form.maxUses" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="form.expiresAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="可选；留空不过期"
            class="w-full!"
          />
        </el-form-item>
        <el-form-item label="绑定公司 ID">
          <el-input
            v-model="form.boundCompanyId"
            placeholder="可选；仅该公司 Boss 可兑"
            maxlength="64"
          />
        </el-form-item>
        <el-form-item label="自定义码">
          <el-input
            v-model="form.code"
            placeholder="可选；留空由服务端生成"
            maxlength="64"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            maxlength="200"
            placeholder="渠道/活动说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">
          {{ createdPreview ? "关闭" : "取消" }}
        </el-button>
        <el-button
          v-if="!createdPreview"
          type="primary"
          :loading="loading"
          @click="submitCreate"
        >
          发行
        </el-button>
        <el-button v-else type="primary" @click="copyCode(createdPreview.code)">
          复制码
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

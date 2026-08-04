<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { handleApiError, message } from "@/utils";
import {
  grantCompanyPlanApi,
  listCompanyPlanGrantsApi,
  revokeCompanyPlanApi,
  type CompanyPlanGrant,
  type SubscriptionPlanCode
} from "@/api/system/subscription";

const props = defineProps<{
  modelValue: boolean;
  companyId: string;
  companyName?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const PLAN_CODE_OPTIONS: Array<{ label: string; value: SubscriptionPlanCode }> =
  [
    { label: "免费计划 FREE", value: "FREE" },
    { label: "高级 PREMIUM", value: "PREMIUM" },
    { label: "买断 BUYOUT", value: "BUYOUT" }
  ];

const visible = computed({
  get: () => props.modelValue,
  set: v => emit("update:modelValue", v)
});

const loading = ref(false);
const grants = ref<CompanyPlanGrant[]>([]);

const grantForm = reactive({
  planCode: "PREMIUM" as SubscriptionPlanCode,
  endsAt: "" as string,
  note: ""
});

const activeGrant = computed(
  () => grants.value.find(g => g.status === "ACTIVE") ?? null
);

const historyColumns: TableColumnList = [
  {
    label: "计划",
    prop: "plan",
    minWidth: 120,
    formatter: ({ plan, planId }) =>
      plan ? `${plan.code}` : String(planId ?? "—").slice(0, 8)
  },
  { label: "来源", prop: "source", width: 90 },
  { label: "状态", prop: "status", width: 110, slot: "status" },
  {
    label: "到期",
    prop: "endsAt",
    minWidth: 150,
    formatter: ({ endsAt }) =>
      endsAt ? String(endsAt).replace("T", " ").substring(0, 19) : "长期"
  },
  {
    label: "功能快照",
    prop: "featureSnapshotKeys",
    minWidth: 140,
    formatter: ({ featureSnapshotKeys }) =>
      Array.isArray(featureSnapshotKeys) && featureSnapshotKeys.length
        ? featureSnapshotKeys.slice(0, 4).join(", ") +
          (featureSnapshotKeys.length > 4 ? "…" : "")
        : "—"
  },
  {
    label: "备注",
    prop: "note",
    minWidth: 100,
    formatter: ({ note }) => note || "—"
  },
  {
    label: "创建",
    prop: "createAt",
    minWidth: 150,
    formatter: ({ createAt }) =>
      createAt ? String(createAt).replace("T", " ").substring(0, 19) : "—"
  }
];

function grantStatusType(
  status: string
): "success" | "info" | "warning" | "danger" {
  if (status === "ACTIVE") return "success";
  if (status === "SUPERSEDED") return "info";
  if (status === "EXPIRED") return "warning";
  return "danger";
}

async function loadGrants() {
  if (!props.companyId) return;
  loading.value = true;
  try {
    const { code, data, msg } = await listCompanyPlanGrantsApi(props.companyId);
    if (code === 200) {
      grants.value = Array.isArray(data) ? data : [];
    } else {
      message(msg || "加载授予历史失败", { type: "error" });
      grants.value = [];
    }
  } catch (error) {
    grants.value = [];
    handleApiError(error, "加载授予历史失败");
  } finally {
    loading.value = false;
  }
}

async function submitGrant() {
  if (!props.companyId) return;
  loading.value = true;
  try {
    const endsAt = grantForm.endsAt
      ? new Date(grantForm.endsAt.replace(" ", "T")).toISOString()
      : undefined;
    const { code, msg } = await grantCompanyPlanApi(props.companyId, {
      planCode: grantForm.planCode,
      endsAt,
      note: grantForm.note.trim() || undefined
    });
    if (code !== 200) {
      message(msg || "授予失败", { type: "error" });
      return;
    }
    message(
      `已授予 ${grantForm.planCode}（覆盖原 ACTIVE；BUYOUT 写入功能快照）`,
      { type: "success" }
    );
    grantForm.note = "";
    grantForm.endsAt = "";
    await loadGrants();
  } catch (error) {
    handleApiError(error, "授予计划失败");
  } finally {
    loading.value = false;
  }
}

async function submitRevoke() {
  if (!props.companyId || !activeGrant.value) return;
  try {
    const { value } = await ElMessageBox.prompt(
      `撤销公司当前 ACTIVE 计划（${activeGrant.value.plan?.code ?? activeGrant.value.planId}）。可选填写原因：`,
      "撤销计划授予",
      {
        confirmButtonText: "撤销",
        cancelButtonText: "取消",
        inputPlaceholder: "原因（可选）",
        inputValue: ""
      }
    );
    loading.value = true;
    try {
      const { code, msg } = await revokeCompanyPlanApi(props.companyId, {
        note: String(value ?? "").trim() || undefined
      });
      if (code !== 200) {
        message(msg || "撤销失败", { type: "error" });
        return;
      }
      message("已撤销当前 ACTIVE 授予（回落解析语义由服务端决定）", {
        type: "success"
      });
      await loadGrants();
    } catch (error) {
      handleApiError(error, "撤销授予失败");
    } finally {
      loading.value = false;
    }
  } catch {
    // cancel
  }
}

watch(
  () => [props.modelValue, props.companyId] as const,
  ([open]) => {
    if (open && props.companyId) {
      grantForm.planCode = "PREMIUM";
      grantForm.endsAt = "";
      grantForm.note = "";
      void loadGrants();
    }
  }
);
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`订阅计划授予 · ${companyName || companyId}`"
    width="820px"
    destroy-on-close
    top="6vh"
  >
    <div class="mb-3 text-sm text-gray-600">
      平台 Admin 直接授予/撤销；与「免费账套导入」无关。无购买入口。当前 ACTIVE
      来自授予历史（无按公司 resolve 接口）。
    </div>

    <el-card shadow="never" class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span>当前 ACTIVE</span>
          <el-button
            v-if="activeGrant"
            type="danger"
            link
            :disabled="loading"
            @click="submitRevoke"
          >
            撤销
          </el-button>
        </div>
      </template>
      <template v-if="activeGrant">
        <div class="flex flex-wrap gap-4 text-sm">
          <div>
            <span class="text-gray-500">计划：</span>
            <el-tag type="success" effect="plain">
              {{ activeGrant.plan?.code ?? activeGrant.planId }}
              <template v-if="activeGrant.plan?.name">
                · {{ activeGrant.plan.name }}
              </template>
            </el-tag>
          </div>
          <div>
            <span class="text-gray-500">来源：</span>
            {{ activeGrant.source }}
          </div>
          <div>
            <span class="text-gray-500">到期：</span>
            {{
              activeGrant.endsAt
                ? String(activeGrant.endsAt).replace("T", " ").substring(0, 19)
                : "长期"
            }}
          </div>
          <div>
            <span class="text-gray-500">跟随更新：</span>
            {{
              activeGrant.plan?.receivesUpdates === false
                ? "否（买断快照）"
                : "是 / 未标明"
            }}
          </div>
        </div>
        <div
          v-if="activeGrant.featureSnapshotKeys?.length"
          class="mt-2 text-xs text-gray-500"
        >
          快照 keys：{{ activeGrant.featureSnapshotKeys.join(", ") }}
        </div>
      </template>
      <el-empty
        v-else
        description="无 ACTIVE 授予（解析可能回落 FREE）"
        :image-size="48"
      />
    </el-card>

    <el-card shadow="never" class="mb-4">
      <template #header>授予新计划</template>
      <el-form label-width="100px" class="max-w-xl">
        <el-form-item label="计划代码" required>
          <el-select v-model="grantForm.planCode" class="w-full">
            <el-option
              v-for="opt in PLAN_CODE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker
            v-model="grantForm.endsAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="可选；PREMIUM 常用；留空长期"
            class="w-full!"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="grantForm.note"
            type="textarea"
            :rows="2"
            maxlength="200"
            placeholder="试用 / 渠道说明"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submitGrant">
            授予
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="text-sm font-medium mb-2">授予历史</div>
    <pure-table
      border
      row-key="uid"
      align-whole="center"
      showOverflowTooltip
      :loading="loading"
      :data="grants"
      :columns="historyColumns"
      :max-height="320"
    >
      <template #status="{ row }">
        <el-tag :type="grantStatusType(row.status)" effect="plain">
          {{ row.status }}
        </el-tag>
      </template>
    </pure-table>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button :loading="loading" @click="loadGrants">刷新</el-button>
    </template>
  </el-dialog>
</template>

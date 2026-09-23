<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { handleApiError, message } from "@/utils";
import {
  getCompanyPlanCurrentApi,
  redeemCompanyPlanApi,
  type CompanyPlanCurrent
} from "@/api/system/subscription";
import { useUserStoreHook } from "@/store/modules/user";
import {
  classifyRedeemFailure,
  isAdminOrBossRole,
  redeemFailureCopy,
  summarizeCompanyPlan
} from "@/utils/companyPlan";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Ticket from "~icons/ep/ticket";
import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "CompanyCurrentPlanCard"
});

const props = withDefaults(
  defineProps<{
    /** When true, treat current user as company Boss (bossId match). */
    isCompanyBoss?: boolean;
  }>(),
  { isCompanyBoss: false }
);

const userStore = useUserStoreHook();
const loading = ref(false);
const redeeming = ref(false);
const plan = ref<CompanyPlanCurrent | null>(null);
const redeemCode = ref("");

const canRedeem = computed(
  () => isAdminOrBossRole(userStore.roles) || props.isCompanyBoss === true
);

const summary = computed(() => summarizeCompanyPlan(plan.value));

const featureTags = computed(() =>
  (plan.value?.featureKeys ?? []).slice(0, 12)
);

async function loadPlan() {
  loading.value = true;
  try {
    const { code, data, msg } = await getCompanyPlanCurrentApi();
    if (code === 200 && data) {
      plan.value = data;
    } else {
      plan.value = null;
      message(msg || "加载当前计划失败", { type: "warning" });
    }
  } catch (e) {
    plan.value = null;
    handleApiError(e, "加载当前计划失败");
  } finally {
    loading.value = false;
  }
}

async function handleRedeem() {
  if (!canRedeem.value) {
    message(redeemFailureCopy("forbidden"), { type: "warning" });
    return;
  }
  const code = redeemCode.value.trim();
  if (!code) {
    message(redeemFailureCopy("empty"), { type: "warning" });
    return;
  }

  redeeming.value = true;
  try {
    const { code: resCode, msg } = await redeemCompanyPlanApi({ code });
    if (resCode === 200) {
      message("兑换成功。若菜单未立即更新，请刷新页面或重新登录以同步权限。", {
        type: "success",
        duration: 5000
      });
      redeemCode.value = "";
      await loadPlan();
      return;
    }
    const kind = classifyRedeemFailure(msg);
    message(redeemFailureCopy(kind, msg), { type: "error" });
  } catch (e) {
    const raw =
      e && typeof e === "object" && "message" in e
        ? String((e as { message?: unknown }).message ?? "")
        : "";
    const kind = classifyRedeemFailure(raw);
    handleApiError(e, redeemFailureCopy(kind, raw || undefined));
  } finally {
    redeeming.value = false;
  }
}

onMounted(() => {
  void loadPlan();
});

defineExpose({ loadPlan });
</script>

<template>
  <el-card v-loading="loading" shadow="hover" class="plan-card">
    <div class="plan-header">
      <div class="plan-header-left">
        <div class="plan-icon">
          <component :is="useRenderIcon(Ticket)" />
        </div>
        <div>
          <div class="plan-title">当前订阅计划</div>
          <div class="plan-subtitle">
            展示本公司有效计划；兑换仅限 Boss / 平台管理员。本页无购买入口。
          </div>
        </div>
      </div>
      <el-button
        text
        type="primary"
        :icon="useRenderIcon(Refresh)"
        :loading="loading"
        @click="loadPlan"
      >
        刷新
      </el-button>
    </div>

    <el-descriptions :column="2" border class="mt-4" size="small">
      <el-descriptions-item label="计划">
        <el-tag type="primary" effect="plain">{{ summary.planLabel }}</el-tag>
        <span v-if="plan?.planCode" class="code-hint"
          >（{{ plan.planCode }}）</span
        >
      </el-descriptions-item>
      <el-descriptions-item label="到期">
        {{ summary.endsAt }}
      </el-descriptions-item>
      <el-descriptions-item label="更新策略">
        {{ summary.receivesUpdates }}
      </el-descriptions-item>
      <el-descriptions-item label="功能摘要">
        {{ summary.features }}
      </el-descriptions-item>
    </el-descriptions>

    <div v-if="featureTags.length" class="feature-tags">
      <el-tag
        v-for="key in featureTags"
        :key="key"
        size="small"
        class="mr-1 mb-1"
        effect="plain"
      >
        {{ key }}
      </el-tag>
      <span
        v-if="(plan?.featureKeys?.length ?? 0) > featureTags.length"
        class="more-hint"
      >
        +{{ (plan?.featureKeys?.length ?? 0) - featureTags.length }}
      </span>
    </div>

    <el-alert
      class="mt-4"
      type="info"
      :closable="false"
      show-icon
      title="说明"
      description="「免费计划」指订阅档位 FREE，与「免费账套导入」无关；兑换成功后菜单/权限可能需刷新或重登后生效。"
    />

    <div v-if="canRedeem" class="redeem-box">
      <div class="redeem-label">Boss 兑换码</div>
      <div class="redeem-row">
        <el-input
          v-model="redeemCode"
          clearable
          maxlength="64"
          placeholder="输入平台发放的计划兑换码"
          @keyup.enter="handleRedeem"
        />
        <el-button
          type="primary"
          :loading="redeeming"
          :disabled="!redeemCode.trim()"
          @click="handleRedeem"
        >
          兑换
        </el-button>
      </div>
    </div>
    <el-alert
      v-else
      class="mt-4"
      type="warning"
      :closable="false"
      show-icon
      title="无兑换权限"
      description="仅公司 Boss 或平台管理员可兑换计划码。当前账号仅可查看计划摘要。"
    />
  </el-card>
</template>

<style scoped lang="scss">
.plan-card {
  margin-bottom: 16px;
  border-radius: 16px;

  :deep(.el-card__body) {
    padding: 20px 24px;
  }
}

.plan-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.plan-header-left {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.plan-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 22px;
  color: #2563eb;
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border-radius: 12px;
}

.plan-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.plan-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
}

.code-hint {
  margin-left: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.feature-tags {
  margin-top: 12px;
}

.more-hint {
  font-size: 12px;
  color: #9ca3af;
}

.redeem-box {
  padding: 14px 16px;
  margin-top: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.redeem-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.redeem-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>

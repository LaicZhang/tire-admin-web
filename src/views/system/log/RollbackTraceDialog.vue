<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { message, confirmBox } from "@/utils/message";
import { handleApiError } from "@/utils";
import {
  getAdminRollbackPlanApi,
  postAdminRollbackByTraceApi,
  type AdminRollbackPlanResponseDto,
  type AdminRollbackResponseDto
} from "@/api/admin/rollback";
import { copyTextToClipboard } from "@pureadmin/utils";

type LogSummary = {
  module?: string;
  method?: string;
  operator?: string;
  createdAt?: string;
  success?: boolean;
};

const props = defineProps<{
  traceId: string;
  initialSection?: "plan" | "execute";
  logSummary?: LogSummary;
}>();

const emit = defineEmits<{
  (e: "success"): void;
  (e: "close", args: { command: "close" | "cancel" | "sure" }): void;
}>();

const loadingPlan = ref(false);
const executing = ref(false);
const plan = ref<AdminRollbackPlanResponseDto | null>(null);
const rollbackResponse = ref<AdminRollbackResponseDto | null>(null);

const reason = ref("");
const force = ref(false);

const canExecute = computed(() => {
  const safeReason = reason.value.trim();
  if (!plan.value) return false;
  if (loadingPlan.value || executing.value) return false;
  if (safeReason.length < 5) return false;
  if (!plan.value.canRollback && !force.value) return false;
  return true;
});

const executeSectionRef = ref<HTMLElement | null>(null);

const copy = (text: string) => {
  if (!text) return;
  const ok = copyTextToClipboard(text);
  ok
    ? message("复制成功", { type: "success" })
    : message("复制失败", { type: "error" });
};

async function loadPlan() {
  const traceId = (props.traceId ?? "").trim();
  if (!traceId) {
    message("traceId 为空", { type: "error" });
    return;
  }
  loadingPlan.value = true;
  rollbackResponse.value = null;
  try {
    const { data } = await getAdminRollbackPlanApi(traceId);
    plan.value = data;
  } catch (e) {
    handleApiError(e, "加载回滚预览失败");
  } finally {
    loadingPlan.value = false;
  }
}

async function scrollToExecuteIfNeeded() {
  if (props.initialSection !== "execute") return;
  await nextTick();
  executeSectionRef.value?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function executeRollback() {
  if (!plan.value) return;
  const safeReason = reason.value.trim();
  if (safeReason.length < 5) {
    message("回滚原因至少需要 5 个字符", { type: "warning" });
    return;
  }

  if (!plan.value.canRollback && !force.value) {
    message("该 traceId 含不支持回滚的快照类型；如确需回滚请开启强制回滚", {
      type: "warning"
    });
    return;
  }

  const confirmText = force.value
    ? "你已开启强制回滚（高风险）。该操作可能跳过冲突校验或忽略不支持快照类型，仍要继续吗？"
    : "确认执行回滚吗？该操作会尝试恢复该 traceId 下的变更。";

  try {
    await confirmBox(confirmText, "二次确认", {
      type: force.value ? "error" : "warning",
      closeOnClickModal: false,
      closeOnPressEscape: false
    });
  } catch (e) {
    if (e !== "cancel") handleApiError(e, "已取消");
    return;
  }

  executing.value = true;
  try {
    const { data } = await postAdminRollbackByTraceApi({
      traceIds: [plan.value.traceId],
      reason: safeReason,
      force: force.value || undefined
    });
    rollbackResponse.value = data;

    const item = data.list?.find(i => i.traceId === plan.value?.traceId);
    if (item?.success) {
      message(`回滚成功：已恢复 ${item.restoredCount} 条`, { type: "success" });
      emit("success");
    } else {
      message("回滚失败，请查看结果详情", { type: "error" });
    }
  } catch (e) {
    handleApiError(e, "回滚失败");
  } finally {
    executing.value = false;
  }
}

onMounted(async () => {
  await loadPlan();
  await scrollToExecuteIfNeeded();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="text-sm text-gray-500">traceId</div>
        <div class="flex items-center gap-2">
          <span class="font-mono break-all" data-test="traceId">{{
            traceId
          }}</span>
          <el-button
            size="small"
            text
            type="primary"
            data-test="copy-traceId"
            @click="copy(traceId)"
          >
            复制
          </el-button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button
          size="small"
          :loading="loadingPlan"
          data-test="refresh-plan"
          @click="loadPlan"
        >
          刷新预览
        </el-button>
        <el-button
          size="small"
          data-test="close"
          @click="emit('close', { command: 'close' })"
        >
          关闭
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="logSummary"
      type="info"
      :closable="false"
      show-icon
      class="!mb-0"
    >
      <template #default>
        <div class="text-sm">
          <span class="mr-3">模块：{{ logSummary.module || "-" }}</span>
          <span class="mr-3">方法：{{ logSummary.method || "-" }}</span>
          <span class="mr-3">操作人：{{ logSummary.operator || "-" }}</span>
          <span class="mr-3">时间：{{ logSummary.createdAt || "-" }}</span>
          <span>
            状态：
            <el-tag
              size="small"
              :type="logSummary.success ? 'success' : 'danger'"
            >
              {{ logSummary.success ? "成功" : "失败" }}
            </el-tag>
          </span>
        </div>
      </template>
    </el-alert>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="font-medium">回滚预览</div>
        <div class="text-sm">
          <el-tag
            v-if="plan"
            :type="plan.canRollback ? 'success' : 'warning'"
            data-test="canRollback"
          >
            {{ plan.canRollback ? "可回滚" : "含不支持快照" }}
          </el-tag>
        </div>
      </div>

      <el-skeleton v-if="loadingPlan" :rows="4" animated />

      <template v-else>
        <el-alert
          v-if="plan && !plan.canRollback"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            当前 traceId 下存在不支持的快照类型（v1 仅支持
            UPDATE）。如确需回滚，请开启强制回滚（高风险）。
          </template>
        </el-alert>

        <el-table
          v-if="plan"
          :data="plan.items"
          size="small"
          border
          max-height="320"
          class="w-full"
        >
          <el-table-column prop="entityType" label="实体" min-width="140" />
          <el-table-column prop="entityId" label="实体ID" min-width="160" />
          <el-table-column prop="operationType" label="操作" width="90" />
          <el-table-column prop="createdAt" label="快照时间" min-width="170" />
          <el-table-column label="支持回滚" width="110">
            <template #default="{ row }">
              <el-tag
                :type="row.rollbackSupported ? 'success' : 'danger'"
                size="small"
              >
                {{ row.rollbackSupported ? "是" : "否" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="note" label="说明" min-width="180" />
        </el-table>
        <div v-else class="text-sm text-gray-500">暂无预览数据</div>
      </template>
    </div>

    <div ref="executeSectionRef" class="space-y-3">
      <div class="font-medium">执行回滚</div>

      <el-alert v-if="force" type="error" :closable="false" show-icon>
        <template #default>
          你已开启强制回滚：可能跳过冲突校验或忽略不支持快照类型，请谨慎操作。
        </template>
      </el-alert>

      <div class="grid grid-cols-1 gap-3">
        <div>
          <div class="text-sm text-gray-600 mb-1">
            回滚原因（至少 5 个字符）
          </div>
          <el-input
            v-model="reason"
            type="textarea"
            :rows="3"
            placeholder="请输入回滚原因"
            data-test="reason"
          />
        </div>
        <div class="flex items-center gap-3">
          <el-switch v-model="force" data-test="force" />
          <span class="text-sm text-gray-600">强制回滚（高风险）</span>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2">
        <el-button
          type="primary"
          :loading="executing"
          :disabled="!canExecute"
          data-test="execute"
          @click="executeRollback"
        >
          执行回滚
        </el-button>
      </div>
    </div>

    <div v-if="rollbackResponse" class="space-y-2">
      <div class="font-medium">回滚结果</div>
      <el-table
        :data="rollbackResponse.list"
        size="small"
        border
        class="w-full"
      >
        <el-table-column prop="traceId" label="traceId" min-width="220" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="restoredCount" label="已恢复" width="90" />
        <el-table-column prop="skippedCount" label="已跳过" width="90" />
        <el-table-column label="reversalLogUid" min-width="220">
          <template #default="{ row }">
            <span class="font-mono break-all">{{
              row.reversalLogUid || "-"
            }}</span>
            <el-button
              v-if="row.reversalLogUid"
              size="small"
              text
              type="primary"
              data-test="copy-reversal"
              @click="copy(row.reversalLogUid)"
            >
              复制
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="错误" min-width="220">
          <template #default="{ row }">
            <div v-if="row.errors?.length" class="text-xs whitespace-pre-wrap">
              {{ row.errors.join("\n") }}
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

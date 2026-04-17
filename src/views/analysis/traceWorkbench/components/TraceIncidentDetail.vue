<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type {
  TraceWorkbenchDetailResponse,
  TraceWorkbenchIncident,
  TraceWorkbenchImpact
} from "@/api/dashboard";
import {
  getTraceWorkbenchIncidentTypeLabel,
  getTraceWorkbenchModuleLabel,
  getTraceWorkbenchSeverityLabel,
  getTraceWorkbenchSeverityTagType,
  getTraceWorkbenchStatusLabel,
  getTraceWorkbenchStatusTagType
} from "../options";

defineOptions({
  name: "TraceIncidentDetail"
});

const props = defineProps<{
  detail: TraceWorkbenchDetailResponse | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  openLog: [];
  preview: [];
  execute: [];
}>();

const router = useRouter();

const hasTraceId = computed(() => Boolean(props.detail?.incident.traceId));

const impactEntries = computed(() => buildImpactEntries(props.detail?.impact));

const actions = computed(() => {
  if (!props.detail) {
    return {
      canOpenLogDetail: false,
      canPreviewRollback: false,
      canExecuteRollback: false
    };
  }
  return props.detail.actions;
});

function buildImpactEntries(impact?: TraceWorkbenchImpact) {
  if (!impact) return [];

  return [
    impact.inventoryDelta
      ? {
          key: "inventoryDelta",
          label: "库存影响",
          value: impact.inventoryDelta
        }
      : null,
    impact.amountDelta
      ? { key: "amountDelta", label: "金额影响", value: impact.amountDelta }
      : null,
    impact.affectedOrderCount !== undefined
      ? {
          key: "affectedOrderCount",
          label: "影响单据数",
          value: String(impact.affectedOrderCount)
        }
      : null,
    impact.affectedSkuCount !== undefined
      ? {
          key: "affectedSkuCount",
          label: "影响 SKU 数",
          value: String(impact.affectedSkuCount)
        }
      : null
  ].filter(Boolean) as Array<{ key: string; label: string; value: string }>;
}

function openDocument(targetPath?: string) {
  if (!targetPath) return;
  void router.push(targetPath);
}
</script>

<template>
  <el-card class="trace-incident-detail">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-base font-semibold text-slate-900">溯源详情</div>
          <div class="text-xs text-slate-500">
            查看链路摘要、影响范围和处置动作
          </div>
        </div>
      </div>
    </template>

    <div v-if="loading" class="space-y-3">
      <el-skeleton animated :rows="6" />
    </div>

    <el-empty
      v-else-if="!detail"
      description="请选择左侧异常事件查看详细溯源信息"
    />

    <div v-else class="space-y-5">
      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-lg font-semibold text-slate-900">
                {{ detail.incident.title }}
              </span>
              <el-tag
                size="small"
                :type="
                  getTraceWorkbenchSeverityTagType(detail.incident.severity)
                "
              >
                {{ getTraceWorkbenchSeverityLabel(detail.incident.severity) }}
              </el-tag>
              <el-tag
                size="small"
                effect="plain"
                :type="getTraceWorkbenchStatusTagType(detail.incident.status)"
              >
                {{ getTraceWorkbenchStatusLabel(detail.incident.status) }}
              </el-tag>
            </div>
            <div class="text-sm text-slate-600">
              {{ detail.incident.summary }}
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{{
                getTraceWorkbenchModuleLabel(detail.incident.module)
              }}</span>
              <span>{{
                getTraceWorkbenchIncidentTypeLabel(detail.incident.incidentType)
              }}</span>
              <span>发生时间 {{ detail.incident.occurredAt }}</span>
              <span>操作人 {{ detail.incident.operatorName }}</span>
            </div>
          </div>
          <div class="rounded-xl bg-white px-3 py-2 text-right">
            <div class="text-xs text-slate-400">traceId</div>
            <div class="font-mono text-sm text-slate-700">
              {{ detail.incident.traceId || "当前异常暂不支持 trace 溯源" }}
            </div>
          </div>
        </div>

        <div
          v-if="detail.incident.reasonHint"
          class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          原因提示：{{ detail.incident.reasonHint }}
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div class="space-y-4">
          <section class="rounded-2xl border border-slate-200 bg-white p-4">
            <div class="mb-3 text-sm font-semibold text-slate-900">
              关联单据
            </div>
            <el-empty
              v-if="detail.documents.length === 0"
              description="暂无关联单据"
            />
            <div v-else class="flex flex-wrap gap-2">
              <el-button
                v-for="document in detail.documents"
                :key="document.id"
                text
                bg
                @click="openDocument(document.targetPath)"
              >
                {{ document.label }} / {{ document.no }}
              </el-button>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-4">
            <div class="mb-3 text-sm font-semibold text-slate-900">
              链路时间线
            </div>
            <el-empty
              v-if="detail.timeline.length === 0"
              description="暂无时间线"
            />
            <div v-else class="space-y-3">
              <div
                v-for="item in detail.timeline"
                :key="`${item.time}-${item.action}`"
                class="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="font-medium text-slate-900">
                    {{ item.action }}
                  </div>
                  <div class="text-xs text-slate-500">{{ item.time }}</div>
                </div>
                <div class="mt-1 text-sm text-slate-600">
                  {{ item.operatorName }} / {{ item.result }}
                </div>
                <div v-if="item.remark" class="mt-1 text-xs text-slate-500">
                  {{ item.remark }}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="space-y-4">
          <section class="rounded-2xl border border-slate-200 bg-white p-4">
            <div class="mb-3 text-sm font-semibold text-slate-900">
              影响范围
            </div>
            <el-empty
              v-if="impactEntries.length === 0"
              description="暂无影响范围数据"
            />
            <div v-else class="grid gap-3">
              <div
                v-for="entry in impactEntries"
                :key="entry.key"
                class="rounded-xl bg-slate-50 p-3"
              >
                <div class="text-xs text-slate-500">{{ entry.label }}</div>
                <div class="mt-1 text-lg font-semibold text-slate-900">
                  {{ entry.value }}
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-4">
            <div class="mb-3 text-sm font-semibold text-slate-900">
              处置动作
            </div>
            <div
              v-if="!hasTraceId"
              class="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              当前异常暂不支持 trace 溯源
            </div>
            <div class="grid gap-3">
              <el-button
                data-test="open-log"
                type="primary"
                :disabled="!hasTraceId || !actions.canOpenLogDetail"
                @click="emit('openLog')"
              >
                查看完整日志
              </el-button>
              <el-button
                data-test="preview-trace"
                :disabled="!hasTraceId || !actions.canPreviewRollback"
                @click="emit('preview')"
              >
                溯源预览
              </el-button>
              <el-button
                data-test="execute-rollback"
                type="warning"
                :disabled="!hasTraceId || !actions.canExecuteRollback"
                @click="emit('execute')"
              >
                执行回滚
              </el-button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { TraceWorkbenchIncident } from "@/api/dashboard";
import {
  getTraceWorkbenchIncidentTypeLabel,
  getTraceWorkbenchModuleLabel,
  getTraceWorkbenchSeverityLabel,
  getTraceWorkbenchSeverityTagType,
  getTraceWorkbenchStatusLabel,
  getTraceWorkbenchStatusTagType
} from "../options";

defineOptions({
  name: "TraceIncidentList"
});

const props = defineProps<{
  incidents: TraceWorkbenchIncident[];
  selectedId: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [incidentId: string];
}>();

function handleSelect(incidentId: string) {
  emit("select", incidentId);
}
</script>

<template>
  <el-card class="trace-incident-list">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-base font-semibold text-slate-900">异常候选</div>
          <div class="text-xs text-slate-500">
            按后端优先级排序，优先处理高危事件
          </div>
        </div>
        <el-tag type="info">{{ incidents.length }} 条</el-tag>
      </div>
    </template>

    <div v-loading="loading" class="space-y-3">
      <el-empty
        v-if="!loading && incidents.length === 0"
        description="当前筛选范围内暂无异常事件"
      />

      <button
        v-for="incident in props.incidents"
        :key="incident.incidentId"
        type="button"
        class="trace-incident-item w-full rounded-2xl border p-4 text-left transition"
        :class="
          incident.incidentId === selectedId
            ? 'border-sky-500 bg-sky-50 shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
        "
        :data-test="`incident-${incident.incidentId}`"
        @click="handleSelect(incident.incidentId)"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-semibold text-slate-900">
                {{ incident.title }}
              </span>
              <el-tag size="small" effect="plain">
                {{ getTraceWorkbenchModuleLabel(incident.module) }}
              </el-tag>
              <el-tag
                size="small"
                :type="getTraceWorkbenchSeverityTagType(incident.severity)"
              >
                {{ getTraceWorkbenchSeverityLabel(incident.severity) }}
              </el-tag>
              <el-tag
                size="small"
                effect="plain"
                :type="getTraceWorkbenchStatusTagType(incident.status)"
              >
                {{ getTraceWorkbenchStatusLabel(incident.status) }}
              </el-tag>
            </div>
            <div class="text-sm text-slate-600">{{ incident.summary }}</div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{{
                getTraceWorkbenchIncidentTypeLabel(incident.incidentType)
              }}</span>
              <span>发生时间 {{ incident.occurredAt }}</span>
              <span>操作人 {{ incident.operatorName }}</span>
              <span v-if="incident.primaryDocumentNo">
                主单号 {{ incident.primaryDocumentNo }}
              </span>
            </div>
          </div>

          <div class="space-y-1 text-right text-xs text-slate-500">
            <div v-if="incident.storeName">门店 {{ incident.storeName }}</div>
            <div v-if="incident.repoName">仓库 {{ incident.repoName }}</div>
            <div class="font-mono text-[11px] text-slate-400">
              {{ incident.traceId || "无 traceId" }}
            </div>
          </div>
        </div>
      </button>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.trace-incident-item {
  appearance: none;
}
</style>

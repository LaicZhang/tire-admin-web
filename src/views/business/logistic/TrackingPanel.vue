<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { getTrackingApi, syncTrackingApi, addTrackingNodeApi } from "@/api";
import { message } from "@/utils";
import { type TrackingInfo, type TrackingNode } from "./types";
import TrackingNodeDialog from "./TrackingNodeDialog.vue";

defineOptions({
  name: "TrackingPanel"
});

const props = defineProps<{
  trackingNo?: string;
  logisticUid?: string;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const loading = ref(false);
const syncLoading = ref(false);
const trackingInfo = ref<TrackingInfo | null>(null);
const nodeDialogVisible = ref(false);

async function loadTracking() {
  if (!props.trackingNo) {
    trackingInfo.value = null;
    return;
  }

  loading.value = true;
  try {
    const { data, code, msg } = await getTrackingApi(props.trackingNo);
    if (code === 200) {
      trackingInfo.value = (data as TrackingInfo) || null;
    } else {
      message(msg || "加载物流跟踪信息失败", { type: "error" });
    }
  } catch {
    message("加载物流跟踪信息失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function handleSync() {
  if (!props.trackingNo) {
    message("暂无运单号", { type: "warning" });
    return;
  }

  syncLoading.value = true;
  try {
    const { code, msg } = await syncTrackingApi(props.trackingNo);
    if (code === 200) {
      message("同步成功", { type: "success" });
      await loadTracking();
    } else {
      message(msg || "同步失败", { type: "error" });
    }
  } catch {
    message("同步物流信息失败", { type: "error" });
  } finally {
    syncLoading.value = false;
  }
}

function handleAddNode() {
  nodeDialogVisible.value = true;
}

async function handleNodeSubmit(nodeData: TrackingNode) {
  if (!props.logisticUid) {
    message("缺少物流单信息", { type: "error" });
    return;
  }

  try {
    const { code, msg } = await addTrackingNodeApi({
      logisticUid: props.logisticUid,
      time: nodeData.time,
      location: nodeData.location,
      description: nodeData.description
    });
    if (code === 200) {
      message("添加成功", { type: "success" });
      nodeDialogVisible.value = false;
      await loadTracking();
      emit("refresh");
    } else {
      message(msg || "添加失败", { type: "error" });
    }
  } catch {
    message("添加跟踪节点失败", { type: "error" });
  }
}

function formatTime(time: string) {
  if (!time) return "-";
  return new Date(time).toLocaleString("zh-CN");
}

watch(
  () => props.trackingNo,
  () => {
    loadTracking();
  }
);

onMounted(() => {
  loadTracking();
});
</script>

<template>
  <div v-loading="loading" class="tracking-panel">
    <!-- 顶部信息 -->
    <div class="tracking-header">
      <div class="tracking-info">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="快递公司">
            {{ trackingInfo?.carrier || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="运单号">
            {{ trackingInfo?.trackingNo || props.trackingNo || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="trackingInfo?.status" size="small">
              {{ trackingInfo.status }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <div class="tracking-actions">
        <el-button
          type="primary"
          size="small"
          :loading="syncLoading"
          @click="handleSync"
        >
          同步物流
        </el-button>
        <el-button size="small" @click="handleAddNode">
          手动添加节点
        </el-button>
      </div>
    </div>

    <!-- 时间线 -->
    <div class="tracking-timeline">
      <el-timeline v-if="trackingInfo?.nodes?.length">
        <el-timeline-item
          v-for="(node, index) in trackingInfo.nodes"
          :key="index"
          :timestamp="formatTime(node.time)"
          placement="top"
        >
          <el-card shadow="never" class="timeline-card">
            <div class="node-location">
              <el-icon><component :is="'ep-location'" /></el-icon>
              {{ node.location || "未知位置" }}
            </div>
            <div class="node-description">{{ node.description }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无物流跟踪信息" />
    </div>

    <TrackingNodeDialog
      v-model:visible="nodeDialogVisible"
      @submit="handleNodeSubmit"
    />
  </div>
</template>

<style scoped>
.tracking-panel {
  padding: 16px;
}

.tracking-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tracking-info {
  flex: 1;
}

.tracking-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.tracking-timeline {
  margin-top: 16px;
}

.timeline-card {
  max-width: 400px;
}

.node-location {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
  color: #606266;
}

.node-description {
  font-size: 14px;
  color: #303133;
}
</style>

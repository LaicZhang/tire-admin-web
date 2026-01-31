<script setup lang="ts">
import { ref, watch, computed } from "vue";
import TrackingPanel from "./TrackingPanel.vue";
import DeliveryReceiptCard from "./DeliveryReceiptCard.vue";
import DeliveryExceptionDialog from "./DeliveryExceptionDialog.vue";
import type { LogisticOrder } from "./types";

defineOptions({
  name: "LogisticDetailDrawer"
});

const props = defineProps<{
  visible: boolean;
  logistic: LogisticOrder | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "refresh"): void;
}>();

const drawerVisible = ref(props.visible);
const exceptionDialogVisible = ref(false);

const orderTypeMap: Record<string, string> = {
  "purchase-order": "采购订单",
  "sale-order": "销售订单",
  "return-order": "退货订单",
  "transfer-order": "调拨订单"
};

const statusMap: Record<string, string> = {
  "0": "待发货",
  "1": "部分发货",
  "2": "已发货",
  "3": "已送达",
  "4": "已取消"
};

const logisticUid = computed(() => props.logistic?.uid || "");
const trackingNo = computed(() => props.logistic?.trackingNo || "");

watch(
  () => props.visible,
  val => {
    drawerVisible.value = val;
  }
);

watch(drawerVisible, val => {
  emit("update:visible", val);
});

function handleClose() {
  drawerVisible.value = false;
}

function handleReportException() {
  exceptionDialogVisible.value = true;
}

function handleRefresh() {
  emit("refresh");
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("zh-CN");
}
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="物流详情"
    size="600px"
    @close="handleClose"
  >
    <div v-if="logistic" class="logistic-detail">
      <!-- 基本信息 -->
      <el-card shadow="never" class="mb-4">
        <template #header>
          <span>基本信息</span>
        </template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="物流单号">
            {{ logistic.uid }}
          </el-descriptions-item>
          <el-descriptions-item label="订单类型">
            {{ orderTypeMap[logistic.type] || logistic.type }}
          </el-descriptions-item>
          <el-descriptions-item label="物流状态">
            <el-tag
              :type="
                logistic.logisticsStatus === 3
                  ? 'success'
                  : logistic.logisticsStatus === 4
                    ? 'danger'
                    : logistic.logisticsStatus === 2 ||
                        logistic.logisticsStatus === 1
                      ? 'warning'
                      : 'info'
              "
              size="small"
            >
              {{ statusMap[String(logistic.logisticsStatus)] || "未知" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="是否到达">
            <el-tag
              :type="logistic.isArrival ? 'success' : 'info'"
              size="small"
            >
              {{ logistic.isArrival ? "是" : "否" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发货时间">
            {{ formatDate(logistic.departureAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="到达时间">
            {{ formatDate(logistic.arrivalAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 物流跟踪 -->
      <el-card shadow="never" class="mb-4">
        <template #header>
          <span>物流跟踪</span>
        </template>
        <TrackingPanel
          :tracking-no="trackingNo"
          :logistic-uid="logisticUid"
          @refresh="handleRefresh"
        />
      </el-card>

      <!-- 签收回执 -->
      <DeliveryReceiptCard
        v-if="logistic.logisticsStatus === 3 || logistic.isArrival"
        :logistic-uid="logisticUid"
        @refresh="handleRefresh"
      />

      <!-- 异常上报按钮 -->
      <div class="exception-action">
        <el-button type="danger" @click="handleReportException">
          异常上报
        </el-button>
      </div>

      <!-- 异常上报对话框 -->
      <DeliveryExceptionDialog
        v-model:visible="exceptionDialogVisible"
        :logistic-uid="logisticUid"
        @success="handleRefresh"
      />
    </div>

    <el-empty v-else description="暂无物流信息" />
  </el-drawer>
</template>

<style scoped>
.logistic-detail {
  padding: 0 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.exception-action {
  margin-top: 16px;
  text-align: center;
}
</style>

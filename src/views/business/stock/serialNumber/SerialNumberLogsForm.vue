<script setup lang="ts">
import { ref, watch } from "vue";
import {
  getSerialNumberLogs,
  type SerialNumberLog
} from "@/api/business/serialNumber";
import { message } from "@/utils/message";

interface Props {
  formInline: {
    serialNo: string;
  };
}

const props = defineProps<Props>();

const logsList = ref<SerialNumberLog[]>([]);
const logsLoading = ref(false);

const actionMap: Record<string, string> = {
  IN: "入库",
  OUT: "出库",
  TRANSFER: "调拨",
  ADJUST: "调整"
};

const logColumns: TableColumnList = [
  { label: "操作", prop: "action", width: 100, slot: "action" },
  {
    label: "来源仓库",
    prop: "fromRepoId",
    minWidth: 120,
    formatter: row => row.fromRepoId || "-"
  },
  {
    label: "目标仓库",
    prop: "toRepoId",
    minWidth: 120,
    formatter: row => row.toRepoId || "-"
  },
  {
    label: "单据类型",
    prop: "orderType",
    width: 100,
    formatter: row => row.orderType || "-"
  },
  { label: "时间", prop: "createdAt", width: 160 }
];

const loadLogs = async () => {
  if (!props.formInline.serialNo) return;

  logsLoading.value = true;
  try {
    const { data } = await getSerialNumberLogs(props.formInline.serialNo);
    logsList.value = data;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "获取流转记录失败";
    message(msg, { type: "error" });
  } finally {
    logsLoading.value = false;
  }
};

// 初始加载
watch(
  () => props.formInline.serialNo,
  serialNo => {
    if (serialNo) {
      loadLogs();
    }
  },
  { immediate: true }
);
</script>

<template>
  <pure-table
    :loading="logsLoading"
    :data="logsList"
    border
    :columns="logColumns"
  >
    <template #action="{ row }">
      {{ actionMap[row.action] || row.action }}
    </template>
  </pure-table>
</template>

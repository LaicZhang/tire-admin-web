<script setup lang="ts">
import { onMounted, ref } from "vue";
import { columns } from "./columns";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Save from "~icons/ep/check";
import Refresh from "~icons/ep/refresh";
import { message, handleApiError } from "@/utils";
import {
  listCronJobsApi,
  updateCronJobConfigApi,
  type CronJobInfo
} from "@/api/system/scheduled-jobs";

defineOptions({
  name: "SystemScheduledJobs"
});

const loading = ref(false);
type EditableCronJobInfo = Omit<CronJobInfo, "timeZone"> & { timeZone: string };
const list = ref<EditableCronJobInfo[]>([]);

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data, msg } = await listCronJobsApi();
    if (code !== 200) {
      message(msg || "加载定时任务失败", { type: "error" });
      list.value = [];
      return;
    }
    list.value = Array.isArray(data)
      ? data.map(item => ({
          ...item,
          timeZone: item.timeZone ?? ""
        }))
      : [];
  } catch (error) {
    list.value = [];
    handleApiError(error, "加载定时任务失败");
  } finally {
    loading.value = false;
  }
};

const handleSave = async (row: EditableCronJobInfo) => {
  loading.value = true;
  try {
    const { code, msg } = await updateCronJobConfigApi(row.name, {
      enabled: row.enabled,
      cron: row.cron,
      timeZone: row.timeZone?.trim() ? row.timeZone.trim() : undefined
    });
    if (code === 200) {
      message("保存成功", { type: "success" });
      loadData();
    } else {
      message(msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "保存失败");
  } finally {
    loading.value = false;
  }
};

const formatLastStatus = (row: CronJobInfo): string => {
  if (!row.lastRun) return "-";
  if (row.lastRun.status === "SUCCESS") return "成功";
  if (row.lastRun.status === "FAILED") return "失败";
  return "跳过";
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main p-4">
    <div class="bg-white p-4 rounded-md">
      <PureTableBar
        title="定时任务(CronJobs)"
        :columns="columns"
        @refresh="loadData"
      >
        <template #buttons>
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
            align-whole="center"
            showOverflowTooltip
            :loading="loading"
            :size="size"
            :data="list"
            :columns="dynamicColumns"
          >
            <template #enabled="{ row }">
              <el-switch v-model="row.enabled" />
            </template>
            <template #cron="{ row }">
              <el-input v-model="row.cron" placeholder="cron 表达式" />
            </template>
            <template #timeZone="{ row }">
              <el-input
                v-model="row.timeZone"
                placeholder="例如 Asia/Shanghai"
              />
            </template>
            <template #lastStatus="{ row }">
              <span>{{ formatLastStatus(row) }}</span>
            </template>
            <template #operation="{ row }">
              <el-button
                link
                type="primary"
                :icon="useRenderIcon(Save)"
                :disabled="loading"
                @click="handleSave(row)"
              >
                保存
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
</template>

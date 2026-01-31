<script setup lang="tsx">
import { onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Download from "~icons/ep/download";
import Upload from "~icons/ep/upload";
import Delete from "~icons/ep/delete";
import Refresh from "~icons/ep/refresh";
import { PureTableBar } from "@/components/RePureTableBar";
import StatusTag from "@/components/StatusTag/index.vue";
import { message } from "@/utils";
import {
  ElMessageBox,
  type UploadInstance,
  type UploadRequestOptions
} from "element-plus";
import {
  getBackupListApi,
  createBackupApi,
  restoreBackupApi,
  downloadBackupApi,
  deleteBackupApi,
  updateBackupSettingsApi
} from "@/api/setting";
import type { BackupItem, BackupSettings } from "./types";

defineOptions({
  name: "Backup"
});

const loading = ref(false);
const backupList = ref<BackupItem[]>([]);
const uploadRef = ref<UploadInstance>();
const backupSettings = ref<BackupSettings>({
  autoBackupEnabled: false,
  autoBackupTime: "02:00",
  autoBackupFrequency: "daily",
  keepDays: 30
});

const backupTaskStatusMap = {
  success: { label: "成功", type: "success" },
  failed: { label: "失败", type: "danger" },
  processing: { label: "处理中", type: "warning" }
} as const;

const columns: TableColumnList = [
  {
    label: "备份文件",
    prop: "fileName",
    minWidth: 200
  },
  {
    label: "文件大小",
    prop: "fileSizeText",
    minWidth: 100
  },
  {
    label: "备份类型",
    prop: "backupTypeName",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <el-tag
        type={row.backupType === "auto" ? "info" : "primary"}
        effect="plain"
      >
        {row.backupTypeName}
      </el-tag>
    )
  },
  {
    label: "状态",
    prop: "statusName",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <StatusTag
        status={row.status}
        statusMap={backupTaskStatusMap}
        size="default"
        effect="plain"
      />
    )
  },
  {
    label: "备份时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  },
  {
    label: "操作",
    width: 200,
    fixed: "right",
    slot: "operation"
  }
];

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data } = await getBackupListApi();
    if (code === 200 && data) {
      const maybeList = data as unknown;
      if (Array.isArray(maybeList)) {
        backupList.value = maybeList as BackupItem[];
      } else if (
        typeof maybeList === "object" &&
        maybeList &&
        "list" in maybeList
      ) {
        const list = (maybeList as { list?: BackupItem[] }).list;
        backupList.value = Array.isArray(list) ? list : [];
      } else {
        backupList.value = [];
      }
    } else {
      message("加载备份列表失败", { type: "error" });
    }
  } catch {
    message("加载备份列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const startBackup = async () => {
  try {
    const { value } = await ElMessageBox.prompt(
      "请输入备份备注（可选）",
      "开始备份",
      {
        confirmButtonText: "开始备份",
        cancelButtonText: "取消",
        inputPlaceholder: "请输入备注"
      }
    );
    loading.value = true;
    const payload: Record<string, unknown> = {};
    if (value?.trim()) payload.remark = value.trim();
    const { code } = await createBackupApi(payload);
    if (code === 200) {
      message("备份任务已启动", { type: "success" });
      loadData();
    } else {
      message("启动备份失败", { type: "error" });
    }
  } catch {
    // cancelled
  } finally {
    loading.value = false;
  }
};

const handleUploadRequest = async (options: UploadRequestOptions) => {
  try {
    loading.value = true;
    const formData = new FormData();
    formData.append("file", options.file);
    const { code } = await createBackupApi(formData as unknown as object);
    if (code === 200) {
      options.onSuccess?.({ code });
      message("上传成功", { type: "success" });
      loadData();
    } else {
      const error = new Error("上传失败");
      options.onError?.(error as any);
      message("上传失败", { type: "error" });
    }
  } catch (err) {
    options.onError?.(err as any);
    message("上传失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const restoreBackup = async (row: BackupItem) => {
  if (row.status !== "success") {
    message("只能恢复成功的备份", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要恢复到备份 "${row.fileName}" 吗？恢复后当前数据将被覆盖，此操作不可撤销！`,
      "恢复确认",
      {
        confirmButtonText: "确定恢复",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    loading.value = true;
    const { code } = await restoreBackupApi(row.uid);
    if (code === 200) {
      message("恢复任务已启动", { type: "success" });
      loadData();
    } else {
      message("恢复失败", { type: "error" });
    }
  } catch {
    // cancelled
  } finally {
    loading.value = false;
  }
};

const downloadBackup = async (row: BackupItem) => {
  if (row.status !== "success") {
    message("只能下载成功的备份", { type: "warning" });
    return;
  }
  try {
    loading.value = true;
    const { code, data } = await downloadBackupApi(row.uid);
    if (code !== 200) {
      message("获取下载信息失败", { type: "error" });
      return;
    }
    const downloadUrl =
      typeof data === "string" ? data : (data as { url?: string }).url;
    if (!downloadUrl) {
      message("下载链接为空", { type: "error" });
      return;
    }
    window.open(downloadUrl, "_blank");
    message("开始下载备份文件", { type: "success" });
  } catch {
    message("下载失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const deleteBackup = async (row: BackupItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份 "${row.fileName}" 吗？删除后无法恢复！`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    loading.value = true;
    const { code } = await deleteBackupApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message("删除失败", { type: "error" });
    }
  } catch {
    // cancelled
  } finally {
    loading.value = false;
  }
};

const saveSettings = async () => {
  try {
    const { code } = await updateBackupSettingsApi(backupSettings.value);
    if (code === 200) {
      message("设置保存成功", { type: "success" });
    } else {
      message("设置保存失败", { type: "error" });
    }
  } catch {
    message("设置保存失败", { type: "error" });
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main">
    <!-- 自动备份设置 -->
    <div class="bg-white p-6 rounded-md mb-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">自动备份设置</h3>
        <el-switch
          v-model="backupSettings.autoBackupEnabled"
          active-text="启用自动备份"
          @change="saveSettings"
        />
      </div>
      <div
        v-if="backupSettings.autoBackupEnabled"
        class="grid grid-cols-3 gap-4"
      >
        <div>
          <span class="text-sm text-gray-500 mr-2">备份时间:</span>
          <el-time-select
            v-model="backupSettings.autoBackupTime"
            start="00:00"
            step="01:00"
            end="23:00"
            placeholder="选择时间"
            @change="saveSettings"
          />
        </div>
        <div>
          <span class="text-sm text-gray-500 mr-2">备份频率:</span>
          <el-select
            v-model="backupSettings.autoBackupFrequency"
            @change="saveSettings"
          >
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
          </el-select>
        </div>
        <div>
          <span class="text-sm text-gray-500 mr-2">保留天数:</span>
          <el-input-number
            v-model="backupSettings.keepDays"
            :min="7"
            :max="365"
            @change="saveSettings"
          />
          <span class="text-sm text-gray-400 ml-2">天</span>
        </div>
      </div>
    </div>

    <!-- 备份列表 -->
    <div class="bg-white p-4 rounded-md">
      <PureTableBar title="备份文件列表" @refresh="loadData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(Refresh)"
            :loading="loading"
            @click="startBackup"
          >
            开始备份
          </el-button>
          <el-upload
            ref="uploadRef"
            :show-file-list="false"
            :http-request="handleUploadRequest"
            accept=".zip,.sql,.gz,.tar,.tgz"
          >
            <el-button :icon="useRenderIcon(Upload)" :loading="loading">
              上传备份
            </el-button>
          </el-upload>
        </template>
        <template v-slot="{ size }">
          <pure-table
            border
            adaptive
            row-key="uid"
            alignWhole="center"
            showOverflowTooltip
            :loading="loading"
            :data="backupList"
            :columns="columns"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(Refresh)"
                :disabled="row.status !== 'success'"
                @click="restoreBackup(row)"
              >
                恢复
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(Download)"
                :disabled="row.status !== 'success'"
                @click="downloadBackup(row)"
              >
                下载
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="danger"
                :size="size"
                :icon="useRenderIcon(Delete)"
                @click="deleteBackup(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}
</style>

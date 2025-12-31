<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import {
  getBackupListApi,
  createBackupApi,
  downloadBackupApi,
  deleteBackupApi,
  type BackupTask
} from "@/api/system/backup";
import { message, confirmBox } from "@/utils/message";
import { downloadBlob } from "@/utils/download";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Download from "~icons/ep/download";
import Delete from "~icons/ep/delete";
import Refresh from "~icons/ep/refresh";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "SystemBackup"
});

const loading = ref(false);
const backupList = ref<BackupTask[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns: TableColumnList = [
  {
    label: "文件名",
    minWidth: 200,
    slot: "fileName"
  },
  {
    label: "类型",
    width: 100,
    align: "center",
    slot: "type"
  },
  {
    label: "状态",
    width: 100,
    align: "center",
    slot: "status"
  },
  {
    label: "文件大小",
    width: 120,
    align: "right",
    slot: "fileSize"
  },
  {
    label: "创建时间",
    width: 180,
    slot: "createTime"
  },
  {
    label: "完成时间",
    width: 180,
    slot: "finishAt"
  },
  {
    label: "操作",
    width: 150,
    fixed: "right",
    slot: "operation"
  }
];

// 加载备份列表
const loadData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getBackupListApi(pagination.currentPage);
    if (code === 200) {
      backupList.value = data.list || [];
      pagination.total = data.count || 0;
    }
  } catch (error) {
    message("加载备份列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 创建备份
const handleCreateBackup = async () => {
  try {
    loading.value = true;
    const { code } = await createBackupApi();
    if (code === 200) {
      message("备份任务已创建，请稍后刷新查看进度", { type: "success" });
      loadData();
    }
  } catch (error) {
    message("创建备份失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 下载备份
const handleDownload = async (row: BackupTask) => {
  if (row.status !== "success") {
    message("只能下载成功的备份", { type: "warning" });
    return;
  }

  try {
    loading.value = true;
    const blob = await downloadBackupApi(row.uid);
    downloadBlob(blob, row.fileName || `backup-${row.uid}.sql`, {
      showMessage: true
    });
  } catch (error) {
    message("下载失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 删除备份
const handleDelete = async (row: BackupTask) => {
  try {
    await confirmBox("确定要删除此备份吗？删除后无法恢复。");
    loading.value = true;
    const { code } = await deleteBackupApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    }
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  } finally {
    loading.value = false;
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
};

// 获取状态标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "danger";
    case "running":
      return "warning";
    case "pending":
      return "info";
    default:
      return "info";
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "success":
      return "成功";
    case "failed":
      return "失败";
    case "running":
      return "进行中";
    case "pending":
      return "等待中";
    default:
      return status;
  }
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main p-4">
    <div class="bg-white p-4">
      <PureTableBar
        title="数据库备份管理"
        :columns="columns"
        @refresh="loadData"
      >
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(Plus)"
            :loading="loading"
            @click="handleCreateBackup"
          >
            创建备份
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            border
            stripe
            align-whole="center"
            :loading="loading"
            :size="size"
            :data="backupList"
            :columns="dynamicColumns"
            :pagination="pagination"
            :paginationSmall="size === 'small' ? true : false"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
            @page-current-change="handleCurrentChange"
          >
            <template #fileName="{ row }">
              {{ row.fileName || "-" }}
            </template>
            <template #type="{ row }">
              <el-tag
                :type="row.action === 'backup' ? 'primary' : 'warning'"
                size="small"
              >
                {{ row.action === "backup" ? "备份" : "恢复" }}
              </el-tag>
            </template>
            <template #status="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
            <template #fileSize="{ row }">
              {{ formatFileSize(row.fileSize) }}
            </template>
            <template #createTime="{ row }">
              {{ new Date(row.createdAt).toLocaleString() }}
            </template>
            <template #finishAt="{ row }">
              {{ row.finishAt ? new Date(row.finishAt).toLocaleString() : "-" }}
            </template>
            <template #operation="{ row }">
              <el-button
                v-if="row.action === 'backup' && row.status === 'success'"
                type="primary"
                size="small"
                text
                :icon="useRenderIcon(Download)"
                @click="handleDownload(row)"
              >
                下载
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                :icon="useRenderIcon(Delete)"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>

      <!-- 提示信息 -->
      <div class="mt-4 p-4 bg-yellow-50 rounded text-sm text-yellow-700">
        <p class="font-bold mb-2">⚠️ 注意事项：</p>
        <ul class="list-disc list-inside space-y-1">
          <li>备份文件包含数据库完整数据，请妥善保管</li>
          <li>建议定期创建备份以防数据丢失</li>
          <li>恢复备份将覆盖当前所有数据，请谨慎操作</li>
        </ul>
      </div>
    </div>
  </div>
</template>

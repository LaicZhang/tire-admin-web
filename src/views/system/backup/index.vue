<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getBackupListApi,
  createBackupApi,
  downloadBackupApi,
  deleteBackupApi,
  type BackupTask
} from "@/api/system/backup";
import { message, confirmBox } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Download from "~icons/ep/download";
import Delete from "~icons/ep/delete";
import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "SystemBackup"
});

const loading = ref(false);
const backupList = ref<BackupTask[]>([]);
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 加载备份列表
const loadData = async () => {
  loading.value = true;
  try {
    const { data, code } = await getBackupListApi(pagination.value.currentPage);
    if (code === 200) {
      backupList.value = data.list || [];
      pagination.value.total = data.count || 0;
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
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = row.fileName || `backup-${row.uid}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    message("下载已开始", { type: "success" });
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
  pagination.value.currentPage = val;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main p-4">
    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">数据库备份管理</span>
          <div class="flex space-x-2">
            <el-button :icon="useRenderIcon(Refresh)" @click="loadData">
              刷新
            </el-button>
            <el-button
              type="primary"
              :icon="useRenderIcon(Plus)"
              :loading="loading"
              @click="handleCreateBackup"
            >
              创建备份
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="backupList" stripe border>
        <el-table-column label="文件名" min-width="200">
          <template #default="{ row }">
            {{ row.fileName || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.action === 'backup' ? 'primary' : 'warning'"
              size="small"
            >
              {{ row.action === "backup" ? "备份" : "恢复" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" width="120" align="right">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="完成时间" width="180">
          <template #default="{ row }">
            {{ row.finishAt ? new Date(row.finishAt).toLocaleString() : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
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
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          layout="total, prev, pager, next"
          :total="pagination.total"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 提示信息 -->
      <div class="mt-4 p-4 bg-yellow-50 rounded text-sm text-yellow-700">
        <p class="font-bold mb-2">⚠️ 注意事项：</p>
        <ul class="list-disc list-inside space-y-1">
          <li>备份文件包含数据库完整数据，请妥善保管</li>
          <li>建议定期创建备份以防数据丢失</li>
          <li>恢复备份将覆盖当前所有数据，请谨慎操作</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

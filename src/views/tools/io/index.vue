<script setup lang="ts">
import { ref } from "vue";
import {
  downloadImportTemplateApi,
  downloadExportFileApi,
  getExportTaskStatusApi
} from "@/api/tools";
import { message } from "@/utils/message";
import ImportDialog from "@/components/ImportExport/ImportDialog.vue";
import ExportDialog from "@/components/ImportExport/ExportDialog.vue";

defineOptions({
  name: "IoTool"
});

const activeName = ref("template");
const templateType = ref("user");
const taskId = ref("");
const importDialogVisible = ref(false);
const exportDialogVisible = ref(false);

const typeOptions = [
  { label: "员工导入", value: "user" },
  { label: "商品导入", value: "tire" },
  { label: "客户导入", value: "customer" },
  { label: "供应商导入", value: "provider" }
];

async function downloadTemplate() {
  try {
    const blob = await downloadImportTemplateApi(templateType.value);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `template_${templateType.value}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    message("下载失败", { type: "error" });
  }
}

async function checkTask() {
  if (!taskId.value) return;
  const { data, code } = await getExportTaskStatusApi(taskId.value);
  if (code === 200) {
    if (data.status === "completed") {
      message("任务已完成，开始下载", { type: "success" });
      const blob = await downloadExportFileApi(taskId.value);
      // ... download logic
    } else {
      message(`任务状态: ${data.status}`, { type: "info" });
    }
  }
}

function openImport() {
  importDialogVisible.value = true;
}

function openExport() {
  exportDialogVisible.value = true;
}

function handleImportSuccess() {
  message("导入成功", { type: "success" });
  importDialogVisible.value = false;
}

function handleExportSuccess() {
  message("导出成功", { type: "success" });
  exportDialogVisible.value = false;
}
</script>

<template>
  <el-card>
    <el-tabs v-model="activeName">
      <el-tab-pane label="模板管理" name="template">
        <div class="p-4">
          <el-form inline>
            <el-form-item label="模板类型">
              <el-select v-model="templateType" class="w-48">
                <el-option
                  v-for="item in typeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="downloadTemplate"
                >下载模板</el-button
              >
            </el-form-item>
          </el-form>
          <el-divider />
          <div class="flex gap-4">
            <el-button type="success" @click="openImport"
              >打开通用导入</el-button
            >
            <el-button type="warning" @click="openExport"
              >打开通用导出</el-button
            >
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="异步任务查询" name="task">
        <div class="p-4">
          <el-input
            v-model="taskId"
            placeholder="输入任务ID"
            class="w-64 mr-4"
          />
          <el-button type="primary" @click="checkTask">查询并下载</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <ImportDialog
      v-model:visible="importDialogVisible"
      :type="templateType"
      @success="handleImportSuccess"
    />
    <ExportDialog
      v-model:visible="exportDialogVisible"
      :type="templateType"
      @success="handleExportSuccess"
    />
  </el-card>
</template>

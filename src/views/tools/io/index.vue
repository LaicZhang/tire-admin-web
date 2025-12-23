<script setup lang="ts">
import { ref } from "vue";
import {
  downloadImportTemplateApi,
  downloadExportFileApi,
  getExportTaskStatusApi,
  generateBarcodeApi,
  scanBarcodeApi,
  getPrintTemplateApi,
  savePrintTemplateApi
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

// 条码相关
const barcodeForm = ref({
  code: "",
  type: "code128" as "code128" | "qrcode",
  width: 200,
  height: 100
});
const barcodeImage = ref<string | null>(null);
const scanCode = ref("");
const scanResult = ref<Record<string, unknown> | null>(null);
const barcodeLoading = ref(false);

// 打印相关
const printType = ref("sale-order");
const printTemplate = ref("");
const printLoading = ref(false);

const typeOptions = [
  { label: "员工导入", value: "user" },
  { label: "商品导入", value: "tire" },
  { label: "客户导入", value: "customer" },
  { label: "供应商导入", value: "provider" }
];

const barcodeTypeOptions = [
  { label: "一维码 (Code128)", value: "code128" },
  { label: "二维码 (QRCode)", value: "qrcode" }
];

const printTypeOptions = [
  { label: "销售订单", value: "sale-order" },
  { label: "采购订单", value: "purchase-order" },
  { label: "物流单", value: "logistic" },
  { label: "库存盘点", value: "stock-taking" }
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
    window.URL.revokeObjectURL(url);
    message("模板下载成功", { type: "success" });
  } catch (error) {
    message("下载失败", { type: "error" });
  }
}

async function checkTask() {
  if (!taskId.value) {
    message("请输入任务ID", { type: "warning" });
    return;
  }
  try {
    const { data, code, msg } = await getExportTaskStatusApi(taskId.value);
    if (code === 200) {
      if (data.status === "completed") {
        message("任务已完成，开始下载", { type: "success" });
        const blob = await downloadExportFileApi(taskId.value);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `export_${taskId.value}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (data.status === "processing") {
        message("任务处理中，请稍后再试", { type: "info" });
      } else if (data.status === "failed") {
        message("任务失败: " + (data.error || "未知错误"), { type: "error" });
      } else {
        message(`任务状态: ${data.status}`, { type: "info" });
      }
    } else {
      message(msg || "查询失败", { type: "error" });
    }
  } catch (error) {
    message("查询失败", { type: "error" });
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

// 条码功能
async function generateBarcode() {
  if (!barcodeForm.value.code) {
    message("请输入条码内容", { type: "warning" });
    return;
  }
  barcodeLoading.value = true;
  try {
    const blob = await generateBarcodeApi({
      code: barcodeForm.value.code,
      type: barcodeForm.value.type,
      width: barcodeForm.value.width,
      height: barcodeForm.value.height
    });
    barcodeImage.value = window.URL.createObjectURL(blob);
    message("条码生成成功", { type: "success" });
  } catch (error) {
    message("条码生成失败", { type: "error" });
  } finally {
    barcodeLoading.value = false;
  }
}

function downloadBarcode() {
  if (!barcodeImage.value) return;
  const link = document.createElement("a");
  link.href = barcodeImage.value;
  link.download = `barcode_${barcodeForm.value.code}.png`;
  link.click();
}

async function handleScan() {
  if (!scanCode.value) {
    message("请输入条码", { type: "warning" });
    return;
  }
  barcodeLoading.value = true;
  try {
    const { data, code, msg } = await scanBarcodeApi(scanCode.value);
    if (code === 200) {
      scanResult.value = data;
      message("查询成功", { type: "success" });
    } else {
      message(msg || "查询失败", { type: "error" });
      scanResult.value = null;
    }
  } catch (error) {
    message("查询失败", { type: "error" });
    scanResult.value = null;
  } finally {
    barcodeLoading.value = false;
  }
}

// 打印功能
async function loadPrintTemplate() {
  printLoading.value = true;
  try {
    const { data, code, msg } = await getPrintTemplateApi(printType.value);
    if (code === 200) {
      printTemplate.value = data?.template || "";
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch (error) {
    message("加载模板失败", { type: "error" });
  } finally {
    printLoading.value = false;
  }
}

async function savePrintTemplate() {
  if (!printTemplate.value) {
    message("请输入模板内容", { type: "warning" });
    return;
  }
  printLoading.value = true;
  try {
    const { code, msg } = await savePrintTemplateApi({
      type: printType.value,
      template: printTemplate.value
    });
    if (code === 200) {
      message("保存成功", { type: "success" });
    } else {
      message(msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    message("保存失败", { type: "error" });
  } finally {
    printLoading.value = false;
  }
}
</script>

<template>
  <el-card>
    <el-tabs v-model="activeName">
      <!-- 模板管理 Tab -->
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

      <!-- 异步任务查询 Tab -->
      <el-tab-pane label="异步任务查询" name="task">
        <div class="p-4">
          <el-alert
            type="info"
            :closable="false"
            description="输入异步导出任务的ID，查询任务状态并下载结果文件"
            class="mb-4"
          />
          <div class="flex items-center gap-4">
            <el-input
              v-model="taskId"
              placeholder="输入任务ID"
              class="w-64"
              clearable
            />
            <el-button type="primary" @click="checkTask">查询并下载</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 条码服务 Tab -->
      <el-tab-pane label="条码服务" name="barcode">
        <div class="p-4">
          <el-row :gutter="24">
            <!-- 条码生成 -->
            <el-col :span="12">
              <h4 class="text-base font-medium mb-4">条码生成</h4>
              <el-form label-width="80px">
                <el-form-item label="条码内容">
                  <el-input
                    v-model="barcodeForm.code"
                    placeholder="输入条码内容"
                    clearable
                  />
                </el-form-item>
                <el-form-item label="条码类型">
                  <el-select v-model="barcodeForm.type" class="w-full">
                    <el-option
                      v-for="item in barcodeTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="宽度">
                  <el-input-number
                    v-model="barcodeForm.width"
                    :min="50"
                    :max="500"
                    :step="10"
                  />
                </el-form-item>
                <el-form-item label="高度">
                  <el-input-number
                    v-model="barcodeForm.height"
                    :min="30"
                    :max="300"
                    :step="10"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="barcodeLoading"
                    @click="generateBarcode"
                  >
                    生成条码
                  </el-button>
                </el-form-item>
              </el-form>

              <!-- 条码预览 -->
              <div v-if="barcodeImage" class="mt-4">
                <el-divider content-position="left">预览</el-divider>
                <div class="flex flex-col items-center gap-4">
                  <img
                    :src="barcodeImage"
                    alt="条码预览"
                    class="border rounded p-2"
                  />
                  <el-button size="small" @click="downloadBarcode">
                    下载条码图片
                  </el-button>
                </div>
              </div>
            </el-col>

            <!-- 扫码查询 -->
            <el-col :span="12">
              <h4 class="text-base font-medium mb-4">扫码查询商品</h4>
              <el-form label-width="80px">
                <el-form-item label="条码">
                  <el-input
                    v-model="scanCode"
                    placeholder="输入或扫描条码"
                    clearable
                    @keyup.enter="handleScan"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="barcodeLoading"
                    @click="handleScan"
                  >
                    查询商品
                  </el-button>
                </el-form-item>
              </el-form>

              <!-- 查询结果 -->
              <div v-if="scanResult" class="mt-4">
                <el-divider content-position="left">查询结果</el-divider>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item
                    v-for="(value, key) in scanResult"
                    :key="String(key)"
                    :label="String(key)"
                  >
                    {{ value }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- 打印服务 Tab -->
      <el-tab-pane label="打印模板" name="print">
        <div class="p-4">
          <el-form inline class="mb-4">
            <el-form-item label="模板类型">
              <el-select
                v-model="printType"
                class="w-48"
                @change="loadPrintTemplate"
              >
                <el-option
                  v-for="item in printTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadPrintTemplate">
                加载模板
              </el-button>
            </el-form-item>
          </el-form>

          <el-alert
            type="info"
            :closable="false"
            description="打印模板支持 HTML 格式，可以使用 {{变量名}} 来插入动态数据"
            class="mb-4"
          />

          <el-input
            v-model="printTemplate"
            type="textarea"
            :rows="15"
            placeholder="请输入打印模板内容，支持 HTML 格式"
          />

          <div class="mt-4 flex gap-4">
            <el-button
              type="primary"
              :loading="printLoading"
              @click="savePrintTemplate"
            >
              保存模板
            </el-button>
            <el-button @click="printTemplate = ''">清空</el-button>
          </div>
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

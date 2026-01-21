<script setup lang="ts">
import { ref, computed, watch, h, onUnmounted } from "vue";
import {
  Upload,
  Document,
  Picture,
  Microphone,
  Delete,
  Plus,
  Check,
  Close,
  Loading,
  RefreshRight
} from "@element-plus/icons-vue";
import { message } from "@/utils/message";
import { ElTag, ElButton } from "element-plus";
import {
  UploadMethod,
  ImageType,
  DocumentType,
  documentTypeConfig,
  AIEntryStatus,
  matchStatusConfig
} from "./types";
import { detailColumns } from "./columns";
import { useAiEntrySession } from "./composables/useAiEntrySession";
import { useAiEntryUpload } from "./composables/useAiEntryUpload";
import { useAiEntryRecognition } from "./composables/useAiEntryRecognition";
import { useAiEntryOrderSubmit } from "./composables/useAiEntryOrderSubmit";

defineOptions({
  name: "AIEntry"
});

// 状态
const status = ref<AIEntryStatus>(AIEntryStatus.IDLE);
const uploadMethod = ref<UploadMethod>(UploadMethod.TEXT);
const documentType = ref<DocumentType>(DocumentType.SALE_ORDER);
const enableAutoCreate = ref(false);
const showHistory = ref(false);
let successRedirectTimer: ReturnType<typeof setTimeout> | null = null;

// 会话
const {
  chatUid,
  batchId,
  initChatSession,
  reset: resetSession
} = useAiEntrySession();

// 上传
const {
  textInput,
  textMaxLength,
  uploadedImages,
  maxImages,
  uploadedFile,
  imageType,
  handleTextInput,
  handleImageChange,
  removeImage,
  handleFileChange,
  removeFile,
  canRecognize,
  reset: resetUpload
} = useAiEntryUpload();

// 文档配置
const currentDocConfig = computed(() => documentTypeConfig[documentType.value]);

// 识别
const {
  recognitionResult,
  startRecognition,
  reset: resetRecognition
} = useAiEntryRecognition(chatUid, batchId, enableAutoCreate, currentDocConfig);

// 订单提交
const {
  orderForm,
  historyRecords,
  totalAmount,
  hasUnmatchedProducts,
  updateDetailRow,
  removeDetailRow,
  addDetailRow,
  submitOrder,
  resetForm: resetOrderForm,
  formatFileSize
} = useAiEntryOrderSubmit(currentDocConfig, enableAutoCreate);

// 监听单据类型变化
watch(documentType, val => {
  orderForm.value.documentType = val;
});

// AI识别
async function handleStartRecognition() {
  if (!canRecognize(uploadMethod.value)) {
    message("请先上传内容", { type: "warning" });
    return;
  }

  status.value = AIEntryStatus.RECOGNIZING;

  try {
    await startRecognition(
      uploadMethod.value,
      textInput.value,
      uploadedImages.value,
      uploadedFile.value,
      imageType.value,
      initChatSession
    );

    // 填充订单表单
    if (recognitionResult.value) {
      orderForm.value = {
        documentType: documentType.value,
        partyUid: recognitionResult.value.party?.matchedUid,
        partyName: recognitionResult.value.party?.name,
        orderDate: new Date().toISOString().split("T")[0],
        details: recognitionResult.value.products.map((p, i) => ({
          id: p.id || String(i + 1),
          productUid: p.matchedProductUid,
          productName: p.name,
          productSpec: p.spec,
          quantity: p.quantity,
          unit: p.unit,
          price: p.price,
          amount: (p.quantity || 0) * (p.price || 0),
          isNew: p.matchStatus === "new"
        })),
        totalAmount: recognitionResult.value.totalAmount || 0,
        remark: recognitionResult.value.remark
      };
    }

    status.value = AIEntryStatus.EDITING;
  } catch (error) {
    message("AI识别失败，请重试", { type: "error" });
    status.value = AIEntryStatus.IDLE;
  }
}

// 提交订单
async function handleSubmitOrder() {
  status.value = AIEntryStatus.SUBMITTING;
  const success = await submitOrder(uploadMethod.value, documentType.value);
  if (success) {
    status.value = AIEntryStatus.SUCCESS;
    // Store timer reference for cleanup
    successRedirectTimer = setTimeout(() => {
      handleResetForm();
    }, 3000);
  } else {
    status.value = AIEntryStatus.ERROR;
  }
}

// 重置表单
function handleResetForm() {
  // Clear success redirect timer if exists
  if (successRedirectTimer) {
    clearTimeout(successRedirectTimer);
    successRedirectTimer = null;
  }
  status.value = AIEntryStatus.IDLE;
  resetUpload();
  resetRecognition();
  resetOrderForm(documentType.value);
  resetSession();
}

// Cleanup timer on unmount
onUnmounted(() => {
  if (successRedirectTimer) {
    clearTimeout(successRedirectTimer);
    successRedirectTimer = null;
  }
});

// 计算属性
const canRecognizeValue = computed(() => canRecognize(uploadMethod.value));
</script>

<template>
  <el-card>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-lg font-medium">AI 录单</span>
        <div class="flex items-center gap-2">
          <el-button text @click="showHistory = !showHistory">
            {{ showHistory ? "返回录单" : "历史记录" }}
          </el-button>
          <el-button
            v-if="status !== AIEntryStatus.IDLE"
            @click="handleResetForm"
          >
            重新开始
          </el-button>
        </div>
      </div>
    </template>

    <!-- 历史记录面板 -->
    <div v-if="showHistory" class="p-4">
      <el-empty v-if="historyRecords.length === 0" description="暂无历史记录" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="record in historyRecords"
          :key="record.id"
          :timestamp="new Date(record.timestamp).toLocaleString()"
          :type="record.success ? 'success' : 'danger'"
        >
          <el-card shadow="hover" class="mb-2">
            <div class="flex items-center justify-between">
              <div>
                <el-tag size="small" class="mr-2">
                  {{
                    record.method === UploadMethod.TEXT
                      ? "文本"
                      : record.method === UploadMethod.IMAGE
                        ? "图片"
                        : "文件"
                  }}
                </el-tag>
                <span>{{ record.summary }}</span>
              </div>
              <el-tag
                :type="record.success ? 'success' : 'danger'"
                size="small"
              >
                {{ record.success ? "成功" : "失败" }}
              </el-tag>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 主界面 -->
    <div v-else class="flex gap-6">
      <!-- 左侧：上传区域 -->
      <div class="w-1/2">
        <!-- 单据类型选择 -->
        <div class="mb-4">
          <span class="text-gray-600 mr-2">单据类型：</span>
          <el-select
            v-model="documentType"
            class="w-48"
            :disabled="status !== AIEntryStatus.IDLE"
          >
            <el-option
              v-for="(config, key) in documentTypeConfig"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </div>

        <!-- 上传方式切换 -->
        <el-tabs
          v-model="uploadMethod"
          type="card"
          :disabled="status !== AIEntryStatus.IDLE"
        >
          <!-- 文本上传 -->
          <el-tab-pane :name="UploadMethod.TEXT" label="文本">
            <template #label>
              <div class="flex items-center gap-1">
                <el-icon><Document /></el-icon>
                <span>文本</span>
              </div>
            </template>
            <div class="p-4">
              <el-input
                v-model="textInput"
                type="textarea"
                :rows="12"
                placeholder="请粘贴或输入单据内容，如：商品：轮胎 205/55R16 4条，单价580元；机油 5W-30 2桶，单价320元..."
                :maxlength="textMaxLength"
                show-word-limit
                :disabled="status !== AIEntryStatus.IDLE"
                @input="handleTextInput"
              />
            </div>
          </el-tab-pane>

          <!-- 图片上传 -->
          <el-tab-pane :name="UploadMethod.IMAGE" label="图片">
            <template #label>
              <div class="flex items-center gap-1">
                <el-icon><Picture /></el-icon>
                <span>图片</span>
              </div>
            </template>
            <div class="p-4">
              <div class="mb-4">
                <span class="text-gray-600 mr-2">图片类型：</span>
                <el-radio-group
                  v-model="imageType"
                  :disabled="status !== AIEntryStatus.IDLE"
                >
                  <el-radio :value="ImageType.PRINTED">打印单据</el-radio>
                  <el-radio :value="ImageType.HANDWRITTEN"
                    >手写单/聊天截图</el-radio
                  >
                </el-radio-group>
              </div>

              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleImageChange"
                accept=".png,.jpg,.jpeg"
                :disabled="
                  status !== AIEntryStatus.IDLE ||
                  uploadedImages.length >= maxImages
                "
                multiple
                drag
                class="w-full"
              >
                <div class="flex flex-col items-center justify-center py-6">
                  <el-icon class="text-4xl text-gray-300 mb-2"
                    ><Upload
                  /></el-icon>
                  <p class="text-gray-600 text-sm">点击或拖拽上传图片</p>
                  <p class="text-gray-400 text-xs">
                    最多 {{ maxImages }} 张，单张不超过 10MB
                  </p>
                </div>
              </el-upload>

              <div
                v-if="uploadedImages.length > 0"
                class="mt-4 grid grid-cols-5 gap-2"
              >
                <div
                  v-for="(img, index) in uploadedImages"
                  :key="img.uid"
                  class="relative group"
                >
                  <img
                    :src="img.url"
                    :alt="img.name"
                    class="w-full h-20 object-cover rounded border"
                  />
                  <el-button
                    v-if="status === AIEntryStatus.IDLE"
                    type="danger"
                    size="small"
                    circle
                    class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click="removeImage(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 文件上传 -->
          <el-tab-pane :name="UploadMethod.FILE" label="文件">
            <template #label>
              <div class="flex items-center gap-1">
                <el-icon><Document /></el-icon>
                <span>文件</span>
              </div>
            </template>
            <div class="p-4">
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleFileChange"
                accept=".txt,.pdf,.xlsx,.xls"
                :disabled="
                  status !== AIEntryStatus.IDLE || uploadedFile !== null
                "
                drag
                class="w-full"
              >
                <div class="flex flex-col items-center justify-center py-6">
                  <el-icon class="text-4xl text-gray-300 mb-2"
                    ><Upload
                  /></el-icon>
                  <p class="text-gray-600 text-sm">点击或拖拽上传文件</p>
                  <p class="text-gray-400 text-xs">
                    支持 TXT、PDF、Excel，不超过 10MB
                  </p>
                </div>
              </el-upload>

              <div
                v-if="uploadedFile"
                class="mt-4 p-4 bg-gray-50 rounded flex items-center justify-between"
              >
                <div class="flex items-center">
                  <el-icon class="text-2xl text-blue-500 mr-3"
                    ><Document
                  /></el-icon>
                  <div>
                    <p class="font-medium">{{ uploadedFile.name }}</p>
                    <p class="text-gray-400 text-sm">
                      {{ formatFileSize(uploadedFile.size) }}
                    </p>
                  </div>
                </div>
                <el-button
                  v-if="status === AIEntryStatus.IDLE"
                  type="danger"
                  text
                  @click="removeFile"
                >
                  删除
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- AI识别按钮 -->
        <div class="mt-4 text-center">
          <el-button
            type="primary"
            size="large"
            :disabled="!canRecognizeValue || status !== AIEntryStatus.IDLE"
            :loading="status === AIEntryStatus.RECOGNIZING"
            @click="handleStartRecognition"
          >
            <el-icon v-if="status !== AIEntryStatus.RECOGNIZING" class="mr-1"
              ><Microphone
            /></el-icon>
            {{
              status === AIEntryStatus.RECOGNIZING ? "AI 识别中..." : "AI 识别"
            }}
          </el-button>
        </div>
      </div>

      <!-- 右侧：识别结果与编辑 -->
      <div class="w-1/2 border-l pl-6">
        <!-- 空状态 -->
        <div
          v-if="status === AIEntryStatus.IDLE && !recognitionResult"
          class="h-full flex items-center justify-center"
        >
          <el-empty description="上传内容后点击 AI 识别" />
        </div>

        <!-- 识别中 -->
        <div
          v-else-if="status === AIEntryStatus.RECOGNIZING"
          class="h-full flex flex-col items-center justify-center"
        >
          <el-icon class="text-6xl text-blue-500 mb-4 is-loading"
            ><Loading
          /></el-icon>
          <p class="text-gray-600">AI 正在识别内容...</p>
        </div>

        <!-- 识别结果编辑 -->
        <div
          v-else-if="
            status === AIEntryStatus.EDITING ||
            status === AIEntryStatus.SUBMITTING
          "
          class="space-y-4"
        >
          <!-- 往来单位 -->
          <div class="flex items-center gap-4">
            <span class="text-gray-600 w-20"
              >{{ currentDocConfig.partyLabel }}：</span
            >
            <el-input
              v-model="orderForm.partyName"
              placeholder="请输入或选择"
              class="flex-1"
            />
            <el-tag
              v-if="recognitionResult?.party"
              :type="
                matchStatusConfig[recognitionResult.party.matchStatus].type
              "
              size="small"
            >
              {{ matchStatusConfig[recognitionResult.party.matchStatus].label }}
            </el-tag>
          </div>

          <!-- 日期 -->
          <div class="flex items-center gap-4">
            <span class="text-gray-600 w-20">订单日期：</span>
            <el-date-picker
              v-model="orderForm.orderDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              class="flex-1"
            />
          </div>

          <!-- 智能新增开关 -->
          <div class="flex items-center gap-4">
            <span class="text-gray-600 w-20">智能新增：</span>
            <el-switch v-model="enableAutoCreate" />
            <span class="text-gray-400 text-sm"
              >开启后，未匹配的商品将自动新增至基础资料</span
            >
          </div>

          <!-- 商品明细 -->
          <div class="border rounded">
            <div
              class="bg-gray-50 px-4 py-2 flex items-center justify-between border-b"
            >
              <span class="font-medium">商品明细</span>
              <el-button type="primary" text size="small" @click="addDetailRow">
                <el-icon><Plus /></el-icon> 添加
              </el-button>
            </div>
            <pure-table
              :data="orderForm.details"
              :columns="detailColumns"
              max-height="300"
              size="small"
            >
              <template #productName="{ row, index }">
                <el-input
                  :model-value="row.productName"
                  size="small"
                  placeholder="商品名称"
                  @update:model-value="
                    updateDetailRow(index, 'productName', $event)
                  "
                />
              </template>
              <template #quantity="{ row, index }">
                <el-input-number
                  :model-value="row.quantity"
                  size="small"
                  :min="1"
                  :controls="false"
                  @update:model-value="
                    updateDetailRow(index, 'quantity', $event)
                  "
                />
              </template>
              <template #unit="{ row, index }">
                <el-input
                  :model-value="row.unit"
                  size="small"
                  placeholder="单位"
                  @update:model-value="updateDetailRow(index, 'unit', $event)"
                />
              </template>
              <template #price="{ row, index }">
                <el-input-number
                  :model-value="row.price"
                  size="small"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  @update:model-value="updateDetailRow(index, 'price', $event)"
                />
              </template>
              <template #action="{ index }">
                <el-button
                  type="danger"
                  text
                  size="small"
                  @click="removeDetailRow(index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </pure-table>
          </div>

          <!-- 合计 -->
          <div class="flex justify-end items-center gap-4 pt-4 border-t">
            <span class="text-gray-600">合计金额：</span>
            <span class="text-2xl font-bold text-blue-500">{{
              totalAmount.toFixed(2)
            }}</span>
          </div>

          <!-- 备注 -->
          <div>
            <span class="text-gray-600">备注：</span>
            <el-input
              v-model="orderForm.remark"
              type="textarea"
              :rows="2"
              placeholder="订单备注"
              class="mt-2"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end gap-4 pt-4">
            <el-button @click="handleResetForm">取消</el-button>
            <el-button
              type="primary"
              :loading="status === AIEntryStatus.SUBMITTING"
              @click="handleSubmitOrder"
            >
              {{
                status === AIEntryStatus.SUBMITTING ? "提交中..." : "确认提交"
              }}
            </el-button>
          </div>
        </div>

        <!-- 成功状态 -->
        <div
          v-else-if="status === AIEntryStatus.SUCCESS"
          class="h-full flex flex-col items-center justify-center"
        >
          <el-icon class="text-6xl text-green-500 mb-4"><Check /></el-icon>
          <p class="text-lg font-medium text-green-600">单据创建成功</p>
          <p class="text-gray-400 mt-2">3秒后自动返回...</p>
        </div>

        <!-- 错误状态 -->
        <div
          v-else-if="status === AIEntryStatus.ERROR"
          class="h-full flex flex-col items-center justify-center"
        >
          <el-icon class="text-6xl text-red-500 mb-4"><Close /></el-icon>
          <p class="text-lg font-medium text-red-600">操作失败</p>
          <el-button type="primary" class="mt-4" @click="handleResetForm">
            <el-icon><RefreshRight /></el-icon> 重新开始
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <el-alert v-if="!showHistory" type="info" :closable="false" class="mt-6">
      <template #title>
        <span class="font-medium">使用提示</span>
      </template>
      <template #default>
        <ul class="text-sm text-gray-600 mt-2 space-y-1">
          <li>
            支持文本粘贴、图片上传（拍照/截图）、文件导入（TXT/PDF/Excel）
          </li>
          <li>AI 会自动识别商品名称、数量、单价等信息并匹配系统中的商品</li>
          <li>开启"智能新增基础资料"后，未匹配的商品会自动创建</li>
          <li>单据明细最多支持 300 行商品</li>
        </ul>
      </template>
    </el-alert>
  </el-card>
</template>

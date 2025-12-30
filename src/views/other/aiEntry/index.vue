<script setup lang="ts">
import { ref, computed, watch } from "vue";
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
import {
  addCustomerApi,
  addProviderApi,
  addTireApi,
  chatApi,
  createChatApi,
  createPurchaseInquiryApi,
  createSaleQuotationApi
} from "@/api";
import { ALL_LIST, localForage } from "@/utils";
import type { UploadFile } from "element-plus";
import {
  UploadMethod,
  ImageType,
  type UploadedFile,
  type RecognizedProduct,
  type RecognizedParty,
  type AIRecognitionResult,
  type OrderDetailRow,
  type OrderFormData,
  type HistoryRecord,
  DocumentType,
  documentTypeConfig,
  AIEntryStatus,
  matchStatusConfig
} from "./types";

defineOptions({
  name: "AIEntry"
});

// 状态
const status = ref<AIEntryStatus>(AIEntryStatus.IDLE);
const uploadMethod = ref<UploadMethod>(UploadMethod.TEXT);
const imageType = ref<ImageType>(ImageType.PRINTED);
const documentType = ref<DocumentType>(DocumentType.SALE_ORDER);

// 文本输入
const textInput = ref("");
const textMaxLength = 5000;

// 图片上传
const uploadedImages = ref<UploadedFile[]>([]);
const maxImages = 5;

// 文件上传
const uploadedFile = ref<UploadedFile | null>(null);

// AI识别结果
const recognitionResult = ref<AIRecognitionResult | null>(null);

// 订单表单
const orderForm = ref<OrderFormData>({
  documentType: DocumentType.SALE_ORDER,
  orderDate: new Date().toISOString().split("T")[0],
  details: [],
  totalAmount: 0
});

// 是否开启智能新增基础资料
const enableAutoCreate = ref(false);

// 历史记录
const historyRecords = ref<HistoryRecord[]>([]);
const showHistory = ref(false);

// Chat会话
const chatUid = ref("");
const batchId = ref("");

// 计算属性
const currentDocConfig = computed(() => documentTypeConfig[documentType.value]);

const canRecognize = computed(() => {
  switch (uploadMethod.value) {
    case UploadMethod.TEXT:
      return textInput.value.trim().length > 0;
    case UploadMethod.IMAGE:
      return uploadedImages.value.length > 0;
    case UploadMethod.FILE:
      return uploadedFile.value !== null;
    default:
      return false;
  }
});

const totalAmount = computed(() => {
  return orderForm.value.details.reduce((sum, row) => {
    return sum + (row.amount || 0);
  }, 0);
});

const hasUnmatchedProducts = computed(() => {
  return orderForm.value.details.some(d => !d.productUid && !d.isNew);
});

// 监听单据类型变化
watch(documentType, val => {
  orderForm.value.documentType = val;
});

// 初始化Chat会话
async function initChatSession() {
  try {
    const { data, code, msg } = await createChatApi();
    if (code === 200) {
      chatUid.value = data.uid || "";
      batchId.value = data.batchId || "";
    } else {
      message(msg || "初始化会话失败", { type: "error" });
    }
  } catch (error) {
    message("初始化会话失败", { type: "error" });
  }
}

// 文本处理
function handleTextInput() {
  if (textInput.value.length > textMaxLength) {
    textInput.value = textInput.value.slice(0, textMaxLength);
    message(`文本已截断至 ${textMaxLength} 字符`, { type: "warning" });
  }
}

// 图片上传处理
function handleImageChange(file: UploadFile) {
  if (!file.raw) return;

  const validTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (!validTypes.includes(file.raw.type)) {
    message("仅支持 png、jpg、jpeg 格式图片", { type: "warning" });
    return;
  }

  if (file.raw.size > 10 * 1024 * 1024) {
    message("单张图片大小不能超过 10MB", { type: "warning" });
    return;
  }

  if (uploadedImages.value.length >= maxImages) {
    message(`最多上传 ${maxImages} 张图片`, { type: "warning" });
    return;
  }

  uploadedImages.value.push({
    uid: file.uid,
    name: file.name,
    size: file.raw.size,
    type: file.raw.type,
    url: URL.createObjectURL(file.raw),
    status: "success",
    raw: file.raw
  });
}

function removeImage(index: number) {
  const img = uploadedImages.value[index];
  if (img.url) {
    URL.revokeObjectURL(img.url);
  }
  uploadedImages.value.splice(index, 1);
}

// 文件上传处理
function handleFileChange(file: UploadFile) {
  if (!file.raw) return;

  const validTypes = [
    "text/plain",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
  ];
  const validExtensions = /\.(txt|pdf|xlsx|xls)$/i;

  if (
    !validTypes.includes(file.raw.type) &&
    !file.name.match(validExtensions)
  ) {
    message("仅支持 TXT、PDF、Excel 格式文件", { type: "warning" });
    return;
  }

  if (file.raw.size > 10 * 1024 * 1024) {
    message("文件大小不能超过 10MB", { type: "warning" });
    return;
  }

  uploadedFile.value = {
    uid: file.uid,
    name: file.name,
    size: file.raw.size,
    type: file.raw.type,
    status: "success",
    raw: file.raw
  };
}

function removeFile() {
  uploadedFile.value = null;
}

// AI识别
async function startRecognition() {
  if (!canRecognize.value) {
    message("请先上传内容", { type: "warning" });
    return;
  }

  status.value = AIEntryStatus.RECOGNIZING;

  try {
    // 初始化会话
    if (!chatUid.value) {
      await initChatSession();
    }

    // 构建识别请求
    let contentDescription = "";
    switch (uploadMethod.value) {
      case UploadMethod.TEXT:
        contentDescription = `请从以下文本中识别订单信息，提取商品名称、数量、单价、往来单位等信息，并以JSON格式返回：\n\n${textInput.value}`;
        break;
      case UploadMethod.IMAGE:
        contentDescription = `请识别上传的${uploadedImages.value.length}张图片中的订单信息（图片类型：${imageType.value === ImageType.PRINTED ? "打印单据" : "手写单/聊天截图"}），提取商品名称、数量、单价等信息。`;
        break;
      case UploadMethod.FILE:
        contentDescription = `请识别上传的文件"${uploadedFile.value?.name}"中的订单信息，提取商品名称、数量、单价、往来单位等信息。`;
        break;
    }

    const { data, code, msg } = await chatApi({
      uid: chatUid.value,
      batchId: batchId.value,
      messages: [
        {
          role: "system",
          content: `你是一个专业的订单识别助手。请从用户提供的内容中识别订单信息，包括：
1. 往来单位（客户或供应商）
2. 商品明细（商品名称、数量、单位、单价）
3. 总金额
4. 备注信息

请以JSON格式返回识别结果，格式如下：
{
  "party": { "name": "xxx", "type": "customer|supplier" },
  "products": [
    { "name": "商品名", "quantity": 10, "unit": "条", "price": 100, "spec": "规格" }
  ],
  "totalAmount": 1000,
  "remark": "备注"
}`
        },
        {
          role: "user",
          content: contentDescription
        }
      ]
    });

    if (code === 200 && data.messages) {
      // 解析AI返回的结果
      const aiResponse = data.messages[data.messages.length - 1]?.content || "";
      await parseAIResponse(aiResponse);
    } else {
      throw new Error(msg || "识别失败");
    }
  } catch (error) {
    message("AI识别失败，请重试", { type: "error" });
    status.value = AIEntryStatus.IDLE;
    return;
  }

  status.value = AIEntryStatus.EDITING;
}

function extractJsonText(input: string): string | null {
  const codeBlockMatch = input.match(/```(?:json)?\\s*([\\s\\S]*?)\\s*```/i);
  const text = (codeBlockMatch?.[1] || input).trim();

  const objectStart = text.indexOf("{");
  const objectEnd = text.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return text.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = text.indexOf("[");
  const arrayEnd = text.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return text.slice(arrayStart, arrayEnd + 1);
  }

  return null;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function toString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return undefined;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, "").toLowerCase();
}

async function parseAIResponse(response: string) {
  const jsonText = extractJsonText(response);
  if (!jsonText) {
    message("AI 返回内容未包含可解析的 JSON", { type: "error" });
    throw new Error("AI 返回内容未包含可解析的 JSON");
  }

  const parsed: unknown = (() => {
    try {
      return JSON.parse(jsonText);
    } catch {
      return null;
    }
  })();
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    message("AI 返回 JSON 解析失败", { type: "error" });
    throw new Error("AI 返回 JSON 解析失败");
  }

  const obj = parsed as Record<string, unknown>;
  const partyRaw =
    obj.party && typeof obj.party === "object" && !Array.isArray(obj.party)
      ? (obj.party as Record<string, unknown>)
      : undefined;

  const partyName = toString(partyRaw?.name);
  const partyTypeFromAI = toString(partyRaw?.type);
  const expectedPartyType = currentDocConfig.value.partyType;
  const partyType =
    partyTypeFromAI === "customer" || partyTypeFromAI === "supplier"
      ? (partyTypeFromAI as "customer" | "supplier")
      : expectedPartyType;

  const productsRaw: unknown =
    (Array.isArray(obj.products) && obj.products) ||
    (Array.isArray(obj.items) && obj.items) ||
    [];

  const productList = Array.isArray(productsRaw) ? productsRaw : [];

  const [customerData, providerData, tireData] = await Promise.all([
    localForage().getItem(ALL_LIST.customer),
    localForage().getItem(ALL_LIST.provider),
    localForage().getItem(ALL_LIST.tire)
  ]);

  const customers = Array.isArray(customerData)
    ? customerData
        .filter(
          (c): c is { uid: string; name: string } =>
            !!c &&
            typeof c === "object" &&
            typeof (c as { uid?: unknown }).uid === "string" &&
            typeof (c as { name?: unknown }).name === "string"
        )
        .map(c => ({ uid: c.uid, name: c.name }))
    : [];

  const providers = Array.isArray(providerData)
    ? providerData
        .filter(
          (p): p is { uid: string; name: string } =>
            !!p &&
            typeof p === "object" &&
            typeof (p as { uid?: unknown }).uid === "string" &&
            typeof (p as { name?: unknown }).name === "string"
        )
        .map(p => ({ uid: p.uid, name: p.name }))
    : [];

  const tires = Array.isArray(tireData)
    ? tireData
        .filter(
          (t): t is { uid: string; name: string } =>
            !!t &&
            typeof t === "object" &&
            typeof (t as { uid?: unknown }).uid === "string" &&
            typeof (t as { name?: unknown }).name === "string"
        )
        .map(t => ({ uid: t.uid, name: t.name }))
    : [];

  const partyCandidates = partyType === "customer" ? customers : providers;
  const normalizedPartyName = partyName ? normalizeName(partyName) : "";
  const matchedParty =
    normalizedPartyName.length > 0
      ? partyCandidates.find(
          p => normalizeName(p.name) === normalizedPartyName
        ) ||
        partyCandidates.find(p =>
          normalizeName(p.name).includes(normalizedPartyName)
        )
      : undefined;

  const recognizedProducts = productList
    .map((p, index) => {
      if (!p || typeof p !== "object" || Array.isArray(p)) return null;
      const productObj = p as Record<string, unknown>;
      const name = toString(productObj.name) || "";
      const quantity = toNumber(productObj.quantity) ?? 1;
      const unit = toString(productObj.unit);
      const price = toNumber(productObj.price);
      const spec = toString(productObj.spec);

      if (!name) return null;

      const normalizedProductName = normalizeName(name);
      const matchedTire =
        tires.find(t => normalizeName(t.name) === normalizedProductName) ||
        tires.find(t => normalizeName(t.name).includes(normalizedProductName));

      return {
        id: toString(productObj.id) || String(index + 1),
        name,
        quantity,
        unit,
        price,
        spec,
        matchStatus: matchedTire
          ? ("matched" as const)
          : enableAutoCreate.value
            ? ("new" as const)
            : ("unmatched" as const),
        matchedProductUid: matchedTire?.uid,
        matchedProductName: matchedTire?.name,
        confidence: matchedTire ? 95 : 60
      };
    })
    .filter((p): p is RecognizedProduct => !!p);

  const remark = toString(obj.remark);
  const totalAmountFromAI = toNumber(obj.totalAmount);
  const computedTotal = recognizedProducts.reduce((sum, p) => {
    return sum + (p.quantity || 0) * (p.price || 0);
  }, 0);

  recognitionResult.value = {
    success: true,
    party: partyName
      ? {
          name: partyName,
          type: partyType,
          matchStatus: matchedParty
            ? "matched"
            : enableAutoCreate.value
              ? "new"
              : "unmatched",
          matchedUid: matchedParty?.uid,
          matchedName: matchedParty?.name
        }
      : undefined,
    products: recognizedProducts,
    totalAmount: totalAmountFromAI ?? computedTotal,
    remark,
    rawText: response,
    confidence: recognizedProducts.length > 0 ? 85 : 60
  };

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

// 更新明细行
function updateDetailRow(index: number, field: string, value: unknown) {
  const row = orderForm.value.details[index];
  (row as Record<string, unknown>)[field] = value;

  // 重新计算金额
  if (field === "quantity" || field === "price") {
    row.amount = (row.quantity || 0) * (row.price || 0);
  }
}

function removeDetailRow(index: number) {
  orderForm.value.details.splice(index, 1);
}

function addDetailRow() {
  orderForm.value.details.push({
    id: String(Date.now()),
    productName: "",
    quantity: 1,
    isNew: true
  });
}

// 提交订单
async function submitOrder() {
  if (orderForm.value.details.length === 0) {
    message("请添加商品明细", { type: "warning" });
    return;
  }

  if (orderForm.value.details.length > 300) {
    message("单据明细最多支持 300 行", { type: "error" });
    return;
  }

  if (hasUnmatchedProducts.value && !enableAutoCreate.value) {
    message("存在未匹配的商品，请手动选择或开启智能新增基础资料", {
      type: "warning"
    });
    return;
  }

  status.value = AIEntryStatus.SUBMITTING;

  try {
    const details = orderForm.value.details;

    const toCentInt = (value: unknown) => {
      const n =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number(value)
            : NaN;
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.round(n * 100));
    };

    // 供应商/客户：尝试自动创建
    const partyType = currentDocConfig.value.partyType;
    let partyUid = orderForm.value.partyUid;
    const partyName = (orderForm.value.partyName || "").trim();

    if (!partyUid && partyName && enableAutoCreate.value) {
      if (partyType === "customer") {
        const res = await addCustomerApi({ name: partyName });
        if (res.code === 200 && res.data?.uid) {
          partyUid = res.data.uid;
        }
      } else {
        const res = await addProviderApi({ name: partyName });
        if (res.code === 200 && res.data?.uid) {
          partyUid = res.data.uid;
        }
      }
    }

    // 商品：尝试自动创建
    if (enableAutoCreate.value) {
      for (const row of details) {
        if (row.productUid) continue;
        const name = row.productName.trim();
        if (!name) continue;
        const res = await addTireApi({ name, price: row.price });
        if (res.code === 200 && res.data?.uid) {
          row.productUid = res.data.uid;
          row.isNew = true;
        }
      }
    }

    if (currentDocConfig.value.partyType === "customer" && !partyUid) {
      message("未识别到客户，请补充客户信息或开启智能新增基础资料", {
        type: "error"
      });
      status.value = AIEntryStatus.ERROR;
      return;
    }

    if (details.some(d => !d.productUid)) {
      message("存在未匹配的商品，请补充商品信息或开启智能新增基础资料", {
        type: "error"
      });
      status.value = AIEntryStatus.ERROR;
      return;
    }

    // 创建单据：采购走询价单，销售走报价单
    let createdId: string | number | undefined;
    if (currentDocConfig.value.partyType === "customer") {
      const res = await createSaleQuotationApi({
        customerId: partyUid,
        remark: orderForm.value.remark,
        details: details.map(d => ({
          tireId: d.productUid,
          quantity: Math.max(1, Math.floor(d.quantity || 1)),
          quotedPrice: toCentInt(d.price),
          originalPrice: toCentInt(d.price),
          remark: d.remark
        }))
      });
      if (res.code !== 200) throw new Error(res.msg || "创建失败");
      createdId = res.data?.id ?? res.data?.uid;
    } else {
      const res = await createPurchaseInquiryApi({
        providerId: partyUid,
        remark: orderForm.value.remark,
        details: details.map(d => ({
          tireId: d.productUid,
          quantity: Math.max(1, Math.floor(d.quantity || 1)),
          expectedPrice: d.price == null ? undefined : toCentInt(d.price)
        }))
      });
      if (res.code !== 200) throw new Error(res.msg || "创建失败");
      createdId = res.data?.id ?? res.data?.uid;
    }

    // 记录历史
    historyRecords.value.unshift({
      id: String(Date.now()),
      timestamp: new Date().toISOString(),
      method: uploadMethod.value,
      documentType: documentType.value,
      summary: `${currentDocConfig.value.label} - ${orderForm.value.details.length}个商品`,
      success: true,
      resultOrderUid: createdId ? String(createdId) : undefined
    });

    message("单据创建成功", { type: "success" });
    status.value = AIEntryStatus.SUCCESS;

    // 3秒后重置
    setTimeout(() => {
      resetForm();
    }, 3000);
  } catch (error) {
    message("提交失败，请重试", { type: "error" });
    status.value = AIEntryStatus.ERROR;
  }
}

// 重置表单
function resetForm() {
  status.value = AIEntryStatus.IDLE;
  textInput.value = "";
  uploadedImages.value.forEach(img => {
    if (img.url) URL.revokeObjectURL(img.url);
  });
  uploadedImages.value = [];
  uploadedFile.value = null;
  recognitionResult.value = null;
  orderForm.value = {
    documentType: documentType.value,
    orderDate: new Date().toISOString().split("T")[0],
    details: [],
    totalAmount: 0
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
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
          <el-button v-if="status !== AIEntryStatus.IDLE" @click="resetForm">
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
            :disabled="!canRecognize || status !== AIEntryStatus.IDLE"
            :loading="status === AIEntryStatus.RECOGNIZING"
            @click="startRecognition"
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
            <el-table :data="orderForm.details" max-height="300" size="small">
              <el-table-column label="商品名称" min-width="150">
                <template #default="{ row, $index }">
                  <el-input
                    :model-value="row.productName"
                    size="small"
                    placeholder="商品名称"
                    @update:model-value="
                      updateDetailRow($index, 'productName', $event)
                    "
                  />
                </template>
              </el-table-column>
              <el-table-column label="数量" width="100">
                <template #default="{ row, $index }">
                  <el-input-number
                    :model-value="row.quantity"
                    size="small"
                    :min="1"
                    :controls="false"
                    @update:model-value="
                      updateDetailRow($index, 'quantity', $event)
                    "
                  />
                </template>
              </el-table-column>
              <el-table-column label="单位" width="80">
                <template #default="{ row, $index }">
                  <el-input
                    :model-value="row.unit"
                    size="small"
                    placeholder="单位"
                    @update:model-value="
                      updateDetailRow($index, 'unit', $event)
                    "
                  />
                </template>
              </el-table-column>
              <el-table-column label="单价" width="100">
                <template #default="{ row, $index }">
                  <el-input-number
                    :model-value="row.price"
                    size="small"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    @update:model-value="
                      updateDetailRow($index, 'price', $event)
                    "
                  />
                </template>
              </el-table-column>
              <el-table-column label="金额" width="100" align="right">
                <template #default="{ row }">
                  <span class="text-blue-500">{{
                    (row.amount || 0).toFixed(2)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.productUid" type="success" size="small">
                    已匹配
                  </el-tag>
                  <el-tag v-else-if="row.isNew" type="warning" size="small">
                    新增
                  </el-tag>
                  <el-tag v-else type="danger" size="small"> 未匹配 </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    text
                    size="small"
                    @click="removeDetailRow($index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
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
            <el-button @click="resetForm">取消</el-button>
            <el-button
              type="primary"
              :loading="status === AIEntryStatus.SUBMITTING"
              @click="submitOrder"
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
          <el-button type="primary" class="mt-4" @click="resetForm">
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

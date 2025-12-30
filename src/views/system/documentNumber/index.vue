<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  getDocumentNumberRulesApi,
  upsertDocumentNumberRuleApi,
  DocumentTypeOptions,
  type DocumentNumberRule,
  type UpsertDocumentNumberRuleDto
} from "@/api/system/document-number";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Edit from "~icons/ep/edit";
import Refresh from "~icons/ep/refresh";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "SystemDocumentNumber"
});

const loading = ref(false);
const rules = ref<DocumentNumberRule[]>([]);
const showEditDialog = ref(false);

const columns: TableColumnList = [
  {
    label: "单据类型",
    width: 150,
    slot: "documentType"
  },
  {
    label: "前缀",
    width: 100,
    prop: "prefix"
  },
  {
    label: "日期格式",
    width: 150,
    slot: "dateFormat"
  },
  {
    label: "序号位数",
    width: 100,
    prop: "sequenceDigits",
    align: "center"
  },
  {
    label: "分隔符",
    width: 80,
    align: "center",
    slot: "separator"
  },
  {
    label: "重置周期",
    width: 120,
    slot: "resetCycle"
  },
  {
    label: "示例",
    minWidth: 200,
    slot: "example"
  },
  {
    label: "操作",
    width: 100,
    fixed: "right",
    slot: "operation"
  }
];

// 日期格式选项
const dateFormatOptions = [
  { value: "YYYYMMDD", label: "年月日 (20251226)" },
  { value: "YYMMDD", label: "短年月日 (251226)" },
  { value: "YYYYMM", label: "年月 (202512)" },
  { value: "YYMM", label: "短年月 (2512)" },
  { value: "MMDD", label: "月日 (1226)" },
  { value: "", label: "不使用日期" }
];

// 分隔符选项
const separatorOptions = [
  { value: "-", label: "横线 (-)" },
  { value: "", label: "无分隔符" },
  { value: "_", label: "下划线 (_)" },
  { value: "/", label: "斜线 (/)" }
];

// 编辑表单
const editForm = ref<UpsertDocumentNumberRuleDto>({
  documentType: "",
  prefix: "",
  dateFormat: "YYYYMMDD",
  sequenceDigits: 4,
  separator: "-",
  resetDaily: false,
  resetMonthly: false,
  resetYearly: true
});

// 示例预览
const examplePreview = computed(() => {
  const { prefix, dateFormat, sequenceDigits, separator } = editForm.value;
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  let datePart = "";
  switch (dateFormat) {
    case "YYYYMMDD":
      datePart = `${year}${month}${day}`;
      break;
    case "YYMMDD":
      datePart = `${year.slice(2)}${month}${day}`;
      break;
    case "YYYYMM":
      datePart = `${year}${month}`;
      break;
    case "YYMM":
      datePart = `${year.slice(2)}${month}`;
      break;
    case "MMDD":
      datePart = `${month}${day}`;
      break;
    default:
      datePart = "";
  }

  const seqPart = "1".padStart(sequenceDigits || 4, "0");
  const sep = separator || "";

  const parts = [prefix, datePart, seqPart].filter(Boolean);
  return parts.join(sep);
});

// 获取单据类型标签
const getDocumentTypeLabel = (type: string) => {
  const option = DocumentTypeOptions.find(o => o.value === type);
  return option?.label || type;
};

// 加载规则列表
const loadRules = async () => {
  loading.value = true;
  try {
    const { data, code } = await getDocumentNumberRulesApi();
    if (code === 200) {
      rules.value = data || [];
    }
  } catch (error) {
    message("加载规则失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 编辑规则
const handleEdit = (row?: DocumentNumberRule) => {
  if (row) {
    editForm.value = {
      documentType: row.documentType,
      prefix: row.prefix,
      dateFormat: row.dateFormat || "YYYYMMDD",
      sequenceDigits: row.sequenceDigits || 4,
      separator: row.separator || "-",
      resetDaily: row.resetDaily,
      resetMonthly: row.resetMonthly,
      resetYearly: row.resetYearly
    };
  } else {
    editForm.value = {
      documentType: "",
      prefix: "",
      dateFormat: "YYYYMMDD",
      sequenceDigits: 4,
      separator: "-",
      resetDaily: false,
      resetMonthly: false,
      resetYearly: true
    };
  }
  showEditDialog.value = true;
};

// 保存规则
const handleSave = async () => {
  if (!editForm.value.documentType) {
    message("请选择单据类型", { type: "warning" });
    return;
  }
  if (!editForm.value.prefix) {
    message("请输入前缀", { type: "warning" });
    return;
  }

  try {
    loading.value = true;
    const { code } = await upsertDocumentNumberRuleApi(editForm.value);
    if (code === 200) {
      message("保存成功", { type: "success" });
      showEditDialog.value = false;
      loadRules();
    }
  } catch (error) {
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 获取重置周期描述
const getResetCycleText = (rule: DocumentNumberRule) => {
  if (rule.resetDaily) return "每日重置";
  if (rule.resetMonthly) return "每月重置";
  if (rule.resetYearly) return "每年重置";
  return "不重置";
};

onMounted(() => {
  loadRules();
});
</script>

<template>
  <div class="main p-4">
    <div class="bg-white p-4">
      <PureTableBar
        title="单据编号规则配置"
        :columns="columns"
        @refresh="loadRules"
      >
        <template #buttons>
          <el-button type="primary" @click="handleEdit()"> 添加规则 </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            border
            stripe
            align-whole="center"
            :loading="loading"
            :size="size"
            :data="rules"
            :columns="dynamicColumns"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
          >
            <template #documentType="{ row }">
              {{ getDocumentTypeLabel(row.documentType) }}
            </template>
            <template #dateFormat="{ row }">
              {{ row.dateFormat || "无" }}
            </template>
            <template #separator="{ row }">
              <code v-if="row.separator">{{ row.separator }}</code>
              <span v-else class="text-gray-400">无</span>
            </template>
            <template #resetCycle="{ row }">
              {{ getResetCycleText(row) }}
            </template>
            <template #example="{ row }">
              <code class="bg-gray-100 px-2 py-1 rounded">{{
                row.example
              }}</code>
            </template>
            <template #operation="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                :icon="useRenderIcon(Edit)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>

      <!-- 提示信息 -->
      <div class="mt-4 text-sm text-gray-500">
        <p>💡 提示：</p>
        <ul class="list-disc list-inside ml-2">
          <li>每种单据类型只能配置一条规则</li>
          <li>序号会根据重置周期自动重新计数</li>
          <li>未配置规则的单据将使用系统默认编号格式</li>
        </ul>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editForm.documentType ? '编辑编号规则' : '添加编号规则'"
      width="600px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="单据类型" required>
          <el-select
            v-model="editForm.documentType"
            :disabled="
              !!editForm.documentType &&
              rules.some(r => r.documentType === editForm.documentType)
            "
            placeholder="请选择单据类型"
            class="w-full"
          >
            <el-option
              v-for="item in DocumentTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="
                rules.some(r => r.documentType === item.value) &&
                editForm.documentType !== item.value
              "
            />
          </el-select>
        </el-form-item>

        <el-form-item label="前缀" required>
          <el-input
            v-model="editForm.prefix"
            placeholder="如：SO、PO、RO"
            maxlength="10"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="日期格式">
          <el-select v-model="editForm.dateFormat" class="w-full">
            <el-option
              v-for="item in dateFormatOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="序号位数">
          <el-input-number
            v-model="editForm.sequenceDigits"
            :min="2"
            :max="10"
          />
        </el-form-item>

        <el-form-item label="分隔符">
          <el-select v-model="editForm.separator" class="w-full">
            <el-option
              v-for="item in separatorOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="重置周期">
          <el-radio-group v-model="editForm.resetYearly">
            <el-radio
              :value="false"
              @click="
                editForm.resetDaily = true;
                editForm.resetMonthly = false;
                editForm.resetYearly = false;
              "
              >每日</el-radio
            >
            <el-radio
              :value="false"
              @click="
                editForm.resetDaily = false;
                editForm.resetMonthly = true;
                editForm.resetYearly = false;
              "
              >每月</el-radio
            >
            <el-radio
              :value="true"
              @click="
                editForm.resetDaily = false;
                editForm.resetMonthly = false;
                editForm.resetYearly = true;
              "
              >每年</el-radio
            >
          </el-radio-group>
        </el-form-item>

        <el-form-item label="示例预览">
          <code class="bg-gray-100 px-4 py-2 rounded text-lg font-mono">
            {{ examplePreview }}
          </code>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
  <div>
    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editForm.documentType ? '编辑编号规则' : '添加编号规则'"
      width="600px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="单据类型" required>
          <el-select
            v-model="editForm.documentType"
            :disabled="
              !!editForm.documentType &&
              rules.some(r => r.documentType === editForm.documentType)
            "
            placeholder="请选择单据类型"
            class="w-full"
          >
            <el-option
              v-for="item in DocumentTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="
                rules.some(r => r.documentType === item.value) &&
                editForm.documentType !== item.value
              "
            />
          </el-select>
        </el-form-item>

        <el-form-item label="前缀" required>
          <el-input
            v-model="editForm.prefix"
            placeholder="如：SO、PO、RO"
            maxlength="10"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="日期格式">
          <el-select v-model="editForm.dateFormat" class="w-full">
            <el-option
              v-for="item in dateFormatOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="序号位数">
          <el-input-number
            v-model="editForm.sequenceDigits"
            :min="2"
            :max="10"
          />
        </el-form-item>

        <el-form-item label="分隔符">
          <el-select v-model="editForm.separator" class="w-full">
            <el-option
              v-for="item in separatorOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="重置周期">
          <el-radio-group v-model="editForm.resetYearly">
            <el-radio
              :value="false"
              @click="
                editForm.resetDaily = true;
                editForm.resetMonthly = false;
                editForm.resetYearly = false;
              "
              >每日</el-radio
            >
            <el-radio
              :value="false"
              @click="
                editForm.resetDaily = false;
                editForm.resetMonthly = true;
                editForm.resetYearly = false;
              "
              >每月</el-radio
            >
            <el-radio
              :value="true"
              @click="
                editForm.resetDaily = false;
                editForm.resetMonthly = false;
                editForm.resetYearly = true;
              "
              >每年</el-radio
            >
          </el-radio-group>
        </el-form-item>

        <el-form-item label="示例预览">
          <code class="bg-gray-100 px-4 py-2 rounded text-lg font-mono">
            {{ examplePreview }}
          </code>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

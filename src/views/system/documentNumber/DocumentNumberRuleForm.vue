<script setup lang="ts">
import { ref, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  upsertDocumentNumberRuleApi,
  DocumentTypeOptions,
  type DocumentNumberRule,
  type UpsertDocumentNumberRuleDto
} from "@/api/system/document-number";
import { message } from "@/utils/message";
import { elementRules } from "@/utils/validation/elementRules";

const props = defineProps<{
  initialData: UpsertDocumentNumberRuleDto;
  existingRules: DocumentNumberRule[];
  onSuccess: () => void;
  onClose: () => void;
}>();

const loading = ref(false);
const formRef = ref<FormInstance>();
const editForm = ref<UpsertDocumentNumberRuleDto>({ ...props.initialData });

const rules: FormRules = {
  documentType: [elementRules.requiredSelect("请选择单据类型", "change")],
  prefix: [
    elementRules.requiredStringTrim("请输入前缀"),
    elementRules.maxLen(10, "前缀最多 10 个字符")
  ],
  dateFormat: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        const allowed = new Set([
          "YYYYMMDD",
          "YYMMDD",
          "YYYYMM",
          "YYMM",
          "MMDD",
          ""
        ]);
        if (!allowed.has(String(value ?? "")))
          return callback(new Error("日期格式不合法"));
        callback();
      }
    }
  ],
  sequenceDigits: [
    {
      trigger: "blur",
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === "")
          return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 2 || n > 10)
          return callback(new Error("序号位数需为 2~10 的整数"));
        callback();
      }
    }
  ],
  separator: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        const allowed = new Set(["-", "", "_", "/"]);
        if (!allowed.has(String(value ?? "")))
          return callback(new Error("分隔符不合法"));
        callback();
      }
    }
  ]
};

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

// 保存规则
const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  editForm.value.prefix = String(editForm.value.prefix || "").trim();

  try {
    loading.value = true;
    const { code } = await upsertDocumentNumberRuleApi(editForm.value);
    if (code === 200) {
      message("保存成功", { type: "success" });
      props.onSuccess();
    }
  } catch (error) {
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

function setResetCycle(type: "daily" | "monthly" | "yearly") {
  editForm.value.resetDaily = type === "daily";
  editForm.value.resetMonthly = type === "monthly";
  editForm.value.resetYearly = type === "yearly";
}
</script>

<template>
  <div>
    <el-form ref="formRef" :model="editForm" :rules="rules" label-width="100px">
      <el-form-item label="单据类型" prop="documentType">
        <el-select
          v-model="editForm.documentType"
          :disabled="
            !!props.initialData.documentType &&
            existingRules.some(
              r => r.documentType === props.initialData.documentType
            )
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
              existingRules.some(r => r.documentType === item.value) &&
              editForm.documentType !== item.value
            "
          />
        </el-select>
      </el-form-item>

      <el-form-item label="前缀" prop="prefix">
        <el-input
          v-model="editForm.prefix"
          placeholder="如：SO、PO、RO"
          maxlength="10"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="日期格式" prop="dateFormat">
        <el-select v-model="editForm.dateFormat" class="w-full">
          <el-option
            v-for="item in dateFormatOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="序号位数" prop="sequenceDigits">
        <el-input-number v-model="editForm.sequenceDigits" :min="2" :max="10" />
      </el-form-item>

      <el-form-item label="分隔符" prop="separator">
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
        <el-radio-group :model-value="editForm.resetYearly">
          <el-radio :value="false" @click="setResetCycle('daily')"
            >每日</el-radio
          >
          <el-radio :value="false" @click="setResetCycle('monthly')"
            >每月</el-radio
          >
          <el-radio :value="true" @click="setResetCycle('yearly')"
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

    <div class="flex justify-end gap-2 mt-4">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSave">
        保存
      </el-button>
    </div>
  </div>
</template>

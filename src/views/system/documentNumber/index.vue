<script setup lang="ts">
import { h, ref, onMounted } from "vue";
import {
  getDocumentNumberRulesApi,
  DocumentTypeOptions,
  type DocumentNumberRule,
  type UpsertDocumentNumberRuleDto
} from "@/api/system/document-number";
import { columns } from "./columns";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Edit from "~icons/ep/edit";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog, closeAllDialog } from "@/composables/useDialogService";
import DocumentNumberRuleForm from "./DocumentNumberRuleForm.vue";

defineOptions({
  name: "SystemDocumentNumber"
});

const loading = ref(false);
const rules = ref<DocumentNumberRule[]>([]);

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
  const initialData: UpsertDocumentNumberRuleDto = row
    ? {
        documentType: row.documentType,
        prefix: row.prefix,
        dateFormat: row.dateFormat || "YYYYMMDD",
        sequenceDigits: row.sequenceDigits || 4,
        separator: row.separator || "-",
        resetDaily: row.resetDaily,
        resetMonthly: row.resetMonthly,
        resetYearly: row.resetYearly
      }
    : {
        documentType: "",
        prefix: "",
        dateFormat: "YYYYMMDD",
        sequenceDigits: 4,
        separator: "-",
        resetDaily: false,
        resetMonthly: false,
        resetYearly: true
      };

  addDialog({
    title: row ? "编辑编号规则" : "添加编号规则",
    width: "600px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(DocumentNumberRuleForm, {
        initialData,
        existingRules: rules.value,
        onSuccess: () => {
          closeAllDialog();
          loadRules();
        },
        onClose: () => closeAllDialog()
      })
  });
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
  </div>
</template>

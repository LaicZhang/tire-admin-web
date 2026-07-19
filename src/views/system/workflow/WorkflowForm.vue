<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import type { FormInstance } from "element-plus";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils";
import { createUid } from "@/utils/uid";
import { Delete } from "@element-plus/icons-vue";
import {
  createWorkflowApi,
  updateWorkflowApi,
  type ApprovalFlowForm,
  type ApprovalFlowVO,
  type ApprovalStrategy
} from "@/api/system/workflow";

interface Props {
  formInline: {
    isEdit: boolean;
    data?: ApprovalFlowVO;
  };
}

const props = defineProps<Props>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const formData = reactive<ApprovalFlowForm>({
  uid: undefined,
  name: "",
  targetType: "purchase",
  minAmount: "",
  maxAmount: "",
  strategy: "ALL",
  steps: [],
  isEnabled: true
});

const rules = {
  name: [{ required: true, message: "请输入流程名称", trigger: "blur" }],
  targetType: [{ required: true, message: "请输入目标单据类型", trigger: "blur" }],
  strategy: [{ required: true, message: "请选择策略", trigger: "change" }]
};

const targetTypeOptions = [
  { label: "采购单 purchase", value: "purchase" },
  { label: "销售单 sale", value: "sale" },
  { label: "调拨 inventory-transfer", value: "inventory-transfer" },
  { label: "其他入库 other-inbound", value: "other-inbound" },
  { label: "其他出库 other-outbound", value: "other-outbound" },
  { label: "盘点 stocktaking", value: "stocktaking" },
  { label: "自定义…", value: "__custom__" }
];

const customTargetType = ref(false);

watch(
  () => props.formInline,
  formInline => {
    if (formInline.isEdit && formInline.data) {
      const d = formInline.data;
      Object.assign(formData, {
        uid: d.uid,
        name: d.name,
        targetType: d.targetType,
        minAmount:
          d.minAmount === null || d.minAmount === undefined
            ? ""
            : String(d.minAmount),
        maxAmount:
          d.maxAmount === null || d.maxAmount === undefined
            ? ""
            : String(d.maxAmount),
        strategy: (d.strategy as ApprovalStrategy) || "ALL",
        steps: (d.steps || []).map(s => ({
          approverIds: [...(s.approverIds || [])],
          roleIds: [...(s.roleIds || [])],
          _uid: createUid()
        })),
        isEnabled: d.isEnabled ?? true
      });
      customTargetType.value = !targetTypeOptions.some(
        o => o.value === d.targetType && o.value !== "__custom__"
      );
    } else {
      Object.assign(formData, {
        uid: undefined,
        name: "",
        targetType: "purchase",
        minAmount: "",
        maxAmount: "",
        strategy: "ALL" as ApprovalStrategy,
        steps: [{ approverIds: [], roleIds: [], _uid: createUid() }],
        isEnabled: true
      });
      customTargetType.value = false;
    }
  },
  { immediate: true }
);

const addStep = () => {
  formData.steps.push({
    approverIds: [],
    roleIds: [],
    _uid: createUid()
  });
};

const removeStep = (index: number) => {
  formData.steps.splice(index, 1);
};

const parseIds = (raw: string): string[] =>
  raw
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean);

const idsToText = (ids?: string[]) => (ids && ids.length ? ids.join(",") : "");

const onTargetTypeChange = (v: string) => {
  if (v === "__custom__") {
    customTargetType.value = true;
    formData.targetType = "";
  }
};

const getFormData = () => formData;

const handleSubmit = async () => {
  if (!formRef.value) return false;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return false;
  if (!formData.steps.length) {
    message("请至少配置一个审批步骤", { type: "warning" });
    return false;
  }

  loading.value = true;
  try {
    if (formData.uid) {
      await updateWorkflowApi(formData.uid, formData);
      message("修改成功", { type: "success" });
    } else {
      await createWorkflowApi(formData);
      message("新增成功", { type: "success" });
    }
    return true;
  } catch (e) {
    handleApiError(e);
    return false;
  } finally {
    loading.value = false;
  }
};

defineExpose({ formRef: formRef, getFormData, handleSubmit });
</script>

<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
    <el-alert
      class="mb-3"
      type="success"
      :closable="false"
      show-icon
      title="真实审批流（ApprovalFlow）"
      description="本页写入的流程会直接参与订单审核运行时；SystemWorkflow 已只读下线。"
    />
    <el-form-item label="流程名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入流程名称" />
    </el-form-item>
    <el-form-item label="单据类型" prop="targetType">
      <div class="flex w-full flex-col gap-2">
        <el-select
          v-if="!customTargetType"
          v-model="formData.targetType"
          placeholder="选择目标单据类型"
          class="w-full"
          @change="onTargetTypeChange"
        >
          <el-option
            v-for="opt in targetTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-input
          v-else
          v-model="formData.targetType"
          placeholder="自定义 targetType，如 purchase-order"
        />
      </div>
    </el-form-item>
    <el-form-item label="策略" prop="strategy">
      <el-radio-group v-model="formData.strategy">
        <el-radio value="ALL">ALL 会签</el-radio>
        <el-radio value="ANY">ANY 或签</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="最小金额">
      <el-input v-model="formData.minAmount" placeholder="可选，整数金额字符串" />
    </el-form-item>
    <el-form-item label="最大金额">
      <el-input v-model="formData.maxAmount" placeholder="可选，整数金额字符串" />
    </el-form-item>
    <el-form-item label="启用">
      <el-switch v-model="formData.isEnabled" />
    </el-form-item>

    <el-divider content-position="left">审批步骤</el-divider>
    <div
      v-for="(step, index) in formData.steps"
      :key="step._uid || index"
      class="mb-3 rounded border border-dashed p-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <el-tag type="info">Step {{ index + 1 }}</el-tag>
        <el-button
          type="danger"
          :icon="Delete"
          circle
          size="small"
          :disabled="formData.steps.length <= 1"
          @click="removeStep(index)"
        />
      </div>
      <el-form-item label="审批人UID">
        <el-input
          :model-value="idsToText(step.approverIds)"
          placeholder="多个 UID 用逗号分隔"
          @update:model-value="v => (step.approverIds = parseIds(String(v)))"
        />
      </el-form-item>
      <el-form-item label="角色UID">
        <el-input
          :model-value="idsToText(step.roleIds)"
          placeholder="多个角色 UID 用逗号分隔"
          @update:model-value="v => (step.roleIds = parseIds(String(v)))"
        />
      </el-form-item>
    </div>
    <el-button
      type="default"
      plain
      class="mt-2 w-full border-dashed"
      @click="addStep"
    >
      添加步骤
    </el-button>
  </el-form>
</template>

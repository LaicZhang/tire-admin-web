<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { fieldRules } from "@/utils/validation/fieldRules";
import {
  stocktakingReasonCodeOptions,
  type StocktakingDetail,
  type UpdateStocktakingDetailDto
} from "./types";
import {
  formatSerialNoListText,
  parseSerialNoListText
} from "@/utils/serialNumber";

interface Props {
  detail: StocktakingDetail;
  mode?: "quantity" | "serial";
}

const props = defineProps<Props>();
const formRef = ref<FormInstance>();

const form = reactive({
  actualCount:
    typeof props.detail.actualCount === "number"
      ? props.detail.actualCount
      : props.detail.bookCount,
  actualSerialNosText: formatSerialNoListText(
    props.detail.actualSerialNos?.length
      ? props.detail.actualSerialNos
      : props.detail.bookSerialNos
  ),
  reasonCode: props.detail.reasonCode || "",
  remark: props.detail.remark || ""
});

const actualCount = computed(() =>
  props.mode === "serial"
    ? parseSerialNoListText(form.actualSerialNosText).length
    : Number(form.actualCount)
);

const requiresReasonCode = computed(
  () =>
    Number.isFinite(actualCount.value) &&
    actualCount.value !== props.detail.bookCount
);

const rules: FormRules = {
  actualCount: fieldRules.nonNegativeNumber({
    label: "实际库存",
    required: true
  }),
  reasonCode: fieldRules.any({
    validator: (_rule, value, callback) => {
      if (!requiresReasonCode.value || value) {
        callback();
        return;
      }
      callback(new Error("差异明细必须选择原因码"));
    },
    trigger: "change"
  })
};

function getPayload(): UpdateStocktakingDetailDto["details"][number] {
  const actualSerialNos =
    props.mode === "serial"
      ? parseSerialNoListText(form.actualSerialNosText)
      : undefined;
  return {
    detailId: props.detail.id,
    actualCount:
      props.mode === "serial"
        ? actualSerialNos?.length || 0
        : Number(form.actualCount),
    actualSerialNos,
    reasonCode: form.reasonCode || undefined,
    remark: form.remark.trim() || undefined
  };
}

defineExpose({
  formRef,
  rules,
  getPayload,
  requiresReasonCode
});
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
    <el-form-item label="账面库存">
      <span>{{ props.detail.bookCount }}</span>
    </el-form-item>
    <el-form-item v-if="mode === 'serial'" label="账面胎号">
      <el-input
        :model-value="formatSerialNoListText(props.detail.bookSerialNos)"
        type="textarea"
        :rows="4"
        disabled
      />
    </el-form-item>
    <el-form-item
      v-if="mode === 'serial'"
      label="实盘胎号"
      prop="actualSerialNosText"
    >
      <el-input
        v-model="form.actualSerialNosText"
        type="textarea"
        :rows="6"
        placeholder="每行一个胎号"
      />
    </el-form-item>
    <el-form-item v-else label="实际库存" prop="actualCount">
      <el-input-number v-model="form.actualCount" :min="0" class="w-full" />
    </el-form-item>
    <el-form-item label="原因码" prop="reasonCode">
      <el-select
        v-model="form.reasonCode"
        clearable
        placeholder="无差异可留空"
        class="w-full"
      >
        <el-option
          v-for="item in stocktakingReasonCodeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="form.remark" type="textarea" :rows="3" />
    </el-form-item>
  </el-form>
</template>

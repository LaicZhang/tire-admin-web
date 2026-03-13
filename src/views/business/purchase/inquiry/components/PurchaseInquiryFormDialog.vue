<script setup lang="ts">
import { reactive, ref } from "vue";
import ProviderSelect from "@/components/EntitySelect/ProviderSelect.vue";
import TireSelect from "@/components/EntitySelect/TireSelect.vue";
import { message } from "@/utils";
import type { CreatePurchaseInquiryApiDto } from "@/api/business/purchase-inquiry";

interface DetailLine {
  tireId?: string;
  quantity: number;
  expectedPrice?: number;
}

interface FormModel {
  providerId?: string;
  deadline?: string;
  remark: string;
  details: DetailLine[];
}

const formRef = ref();
const form = reactive<FormModel>({
  providerId: undefined,
  deadline: undefined,
  remark: "",
  details: [{ tireId: undefined, quantity: 1, expectedPrice: undefined }]
});

const rules = {
  providerId: [{ required: true, message: "请选择供应商", trigger: "change" }],
  deadline: [{ required: true, message: "请选择截止日期", trigger: "change" }]
};

function createLine(): DetailLine {
  return { tireId: undefined, quantity: 1, expectedPrice: undefined };
}

function addLine() {
  form.details.push(createLine());
}

function removeLine(index: number) {
  if (form.details.length === 1) {
    message("至少保留 1 行询价明细", { type: "warning" });
    return;
  }
  form.details.splice(index, 1);
}

function validateLines() {
  for (const [index, detail] of form.details.entries()) {
    const rowNo = index + 1;
    if (!detail.tireId) {
      message(`第 ${rowNo} 行请选择商品`, { type: "warning" });
      return false;
    }
    if (!Number.isInteger(detail.quantity) || detail.quantity <= 0) {
      message(`第 ${rowNo} 行数量需为正整数`, { type: "warning" });
      return false;
    }
    if (
      detail.expectedPrice !== undefined &&
      (!Number.isInteger(detail.expectedPrice) || detail.expectedPrice < 0)
    ) {
      message(`第 ${rowNo} 行期望价需为不小于 0 的整数`, {
        type: "warning"
      });
      return false;
    }
  }
  return true;
}

async function validate() {
  const valid = await formRef.value?.validate().catch(() => false);
  return !!valid && validateLines();
}

function getPayload(): CreatePurchaseInquiryApiDto {
  return {
    providerId: String(form.providerId || ""),
    deadline: String(form.deadline || ""),
    ...(form.remark.trim() ? { remark: form.remark.trim() } : {}),
    details: form.details.map(detail => ({
      tireId: String(detail.tireId || ""),
      quantity: detail.quantity,
      ...(detail.expectedPrice !== undefined
        ? { expectedPrice: detail.expectedPrice }
        : {})
    }))
  };
}

defineExpose({
  validate,
  getPayload
});
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
    <el-form-item label="供应商" prop="providerId">
      <ProviderSelect v-model="form.providerId" />
    </el-form-item>

    <el-form-item label="截止日期" prop="deadline">
      <el-date-picker
        v-model="form.deadline"
        type="date"
        value-format="YYYY-MM-DD"
        class="w-full"
      />
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="form.remark"
        type="textarea"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>

    <div class="mb-3 flex items-center justify-between">
      <span class="text-sm font-medium">询价明细</span>
      <el-button type="primary" link @click="addLine">新增一行</el-button>
    </div>

    <div
      v-for="(detail, index) in form.details"
      :key="index"
      class="mb-4 rounded border border-[var(--el-border-color)] p-3"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm text-[var(--el-text-color-secondary)]">
          第 {{ index + 1 }} 行
        </span>
        <el-button type="danger" link @click="removeLine(index)"
          >删除</el-button
        >
      </div>

      <el-form-item label="商品" label-width="72px">
        <TireSelect v-model="detail.tireId" />
      </el-form-item>

      <div class="grid grid-cols-2 gap-3">
        <el-form-item label="数量" label-width="72px">
          <el-input-number
            v-model="detail.quantity"
            :min="1"
            :step="1"
            :step-strictly="true"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="期望价(分)" label-width="72px">
          <el-input-number
            v-model="detail.expectedPrice"
            :min="0"
            :precision="0"
            class="w-full"
          />
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

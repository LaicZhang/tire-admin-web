<script setup lang="ts">
import { reactive, ref } from "vue";
import ProviderSelect from "@/components/EntitySelect/ProviderSelect.vue";
import { message } from "@/utils";
import type {
  CreatePurchaseQuotationApiDto,
  PurchaseInquiryDto
} from "@/api/business/purchase-inquiry";

interface QuotationDetailLine {
  tireId: string;
  tireName: string;
  quantity: number;
  price: number;
  leadTime?: number;
}

interface FormModel {
  providerId?: string;
  validUntil?: string;
  remark: string;
  details: QuotationDetailLine[];
}

const props = defineProps<{
  inquiry: PurchaseInquiryDto;
}>();

const formRef = ref();
const form = reactive<FormModel>({
  providerId: props.inquiry.providerId ?? undefined,
  validUntil: undefined,
  remark: "",
  details: props.inquiry.details.map(detail => ({
    tireId: String(detail.tireId || ""),
    tireName: detail.tire?.name || String(detail.tireId || "-"),
    quantity: Number(detail.quantity || 0),
    price: 0,
    leadTime: undefined
  }))
});

const rules = {
  providerId: [
    { required: true, message: "请选择报价供应商", trigger: "change" }
  ]
};

function validateDetails() {
  if (form.details.length === 0) {
    message("当前询价单没有可报价明细", { type: "warning" });
    return false;
  }

  for (const [index, detail] of form.details.entries()) {
    const rowNo = index + 1;
    if (!Number.isInteger(detail.quantity) || detail.quantity <= 0) {
      message(`第 ${rowNo} 行报价数量必须为正整数`, { type: "warning" });
      return false;
    }
    if (!Number.isInteger(detail.price) || detail.price <= 0) {
      message(`第 ${rowNo} 行报价单价必须为大于 0 的整数（分）`, {
        type: "warning"
      });
      return false;
    }
    if (
      detail.leadTime !== undefined &&
      (!Number.isInteger(detail.leadTime) || detail.leadTime < 0)
    ) {
      message(`第 ${rowNo} 行交期必须为不小于 0 的整数天数`, {
        type: "warning"
      });
      return false;
    }
  }
  return true;
}

async function validate() {
  const valid = await formRef.value?.validate().catch(() => false);
  return !!valid && validateDetails();
}

function getPayload(): CreatePurchaseQuotationApiDto {
  return {
    inquiryId: props.inquiry.id,
    providerId: String(form.providerId || ""),
    ...(form.validUntil ? { validUntil: form.validUntil } : {}),
    ...(form.remark.trim() ? { remark: form.remark.trim() } : {}),
    details: form.details.map(detail => ({
      tireId: detail.tireId,
      quantity: detail.quantity,
      price: detail.price,
      ...(detail.leadTime !== undefined ? { leadTime: detail.leadTime } : {})
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
    <el-form-item label="报价供应商" prop="providerId">
      <ProviderSelect v-model="form.providerId" />
    </el-form-item>

    <el-form-item label="有效期至">
      <el-date-picker
        v-model="form.validUntil"
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

    <div class="mb-3 text-sm font-medium">报价明细</div>
    <div
      v-for="(detail, index) in form.details"
      :key="`${detail.tireId}-${index}`"
      class="mb-4 rounded border border-[var(--el-border-color)] p-3"
    >
      <div class="mb-3 text-sm text-[var(--el-text-color-secondary)]">
        {{ detail.tireName }} / 数量 {{ detail.quantity }}
      </div>
      <div class="grid grid-cols-2 gap-3">
        <el-form-item label="报价单价(分)" label-width="96px">
          <el-input-number
            v-model="detail.price"
            :min="1"
            :precision="0"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="交期(天)" label-width="96px">
          <el-input-number
            v-model="detail.leadTime"
            :min="0"
            :precision="0"
            class="w-full"
          />
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

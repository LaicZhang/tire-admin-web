<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import CustomerSelect from "@/components/EntitySelect/CustomerSelect.vue";
import TireSelect from "@/components/EntitySelect/TireSelect.vue";
import { message } from "@/utils";

interface DetailLine {
  tireId?: string;
  quantity: number;
  quotedPrice: number;
  originalPrice?: number;
  remark?: string;
}

interface FormModel {
  customerId?: string;
  validUntil?: string;
  remark?: string;
  details: DetailLine[];
}

const formRef = ref();
const form = reactive<FormModel>({
  customerId: undefined,
  validUntil: undefined,
  remark: "",
  details: [
    {
      tireId: undefined,
      quantity: 1,
      quotedPrice: 0,
      originalPrice: 0,
      remark: ""
    }
  ]
});

const rules = {
  customerId: [{ required: true, message: "请选择客户", trigger: "change" }]
};

const totalAmount = computed(() =>
  form.details.reduce(
    (sum, detail) =>
      sum + Number(detail.quantity || 0) * Number(detail.quotedPrice || 0),
    0
  )
);

function addLine() {
  form.details.push({
    tireId: undefined,
    quantity: 1,
    quotedPrice: 0,
    originalPrice: 0,
    remark: ""
  });
}

function removeLine(index: number) {
  if (form.details.length === 1) {
    message("至少保留 1 行报价明细", { type: "warning" });
    return;
  }
  form.details.splice(index, 1);
}

function validateLines() {
  for (let index = 0; index < form.details.length; index += 1) {
    const line = form.details[index];
    const rowNo = index + 1;
    if (!line.tireId) {
      message(`第 ${rowNo} 行请选择商品`, { type: "warning" });
      return false;
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      message(`第 ${rowNo} 行数量需为正整数`, { type: "warning" });
      return false;
    }
    if (Number(line.quotedPrice) <= 0) {
      message(`第 ${rowNo} 行报价需大于 0`, { type: "warning" });
      return false;
    }
  }
  return true;
}

async function validate() {
  await formRef.value?.validate();
  return validateLines();
}

function getPayload() {
  return {
    customerId: String(form.customerId || ""),
    ...(form.validUntil ? { validUntil: form.validUntil } : {}),
    ...(form.remark?.trim() ? { remark: form.remark.trim() } : {}),
    details: form.details.map(detail => ({
      tireId: String(detail.tireId || ""),
      quantity: detail.quantity,
      quotedPrice: Number(detail.quotedPrice || 0),
      ...(Number(detail.originalPrice || 0) > 0
        ? { originalPrice: Number(detail.originalPrice || 0) }
        : {}),
      ...(detail.remark?.trim() ? { remark: detail.remark.trim() } : {})
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
    <el-form-item label="客户" prop="customerId">
      <CustomerSelect v-model="form.customerId" />
    </el-form-item>

    <el-form-item label="有效期">
      <el-date-picker
        v-model="form.validUntil"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="可选"
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
      <span class="text-sm font-medium">报价明细</span>
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

        <el-form-item label="报价(分)" label-width="72px">
          <el-input-number
            v-model="detail.quotedPrice"
            :min="0"
            :precision="0"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="原价(分)" label-width="72px">
          <el-input-number
            v-model="detail.originalPrice"
            :min="0"
            :precision="0"
            class="w-full"
          />
        </el-form-item>
      </div>

      <el-form-item label="备注" label-width="72px" class="mb-0">
        <el-input v-model="detail.remark" maxlength="100" />
      </el-form-item>
    </div>

    <div class="text-right text-sm text-[var(--el-text-color-secondary)]">
      报价合计: {{ totalAmount }} 分
    </div>
  </el-form>
</template>

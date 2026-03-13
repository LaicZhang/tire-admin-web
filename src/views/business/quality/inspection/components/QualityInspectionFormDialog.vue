<script setup lang="ts">
import { reactive, ref } from "vue";
import { message } from "@/utils";
import type {
  CreateQualityInspectionDto,
  InspectionResult
} from "@/api/business/quality";

interface FormModel extends CreateQualityInspectionDto {}

const formRef = ref();
const form = reactive<FormModel>({
  purchaseOrderUid: "",
  detailId: undefined,
  inspectedQty: 0,
  qualifiedQty: 0,
  unqualifiedQty: 0,
  result: "PASS",
  handler: "",
  inspectedAt: new Date().toISOString(),
  remark: ""
});

const resultOptions: Array<{ label: string; value: InspectionResult }> = [
  { label: "合格", value: "PASS" },
  { label: "部分合格", value: "PARTIAL" },
  { label: "不合格", value: "FAIL" }
];

const rules = {
  purchaseOrderUid: [
    { required: true, message: "请输入采购订单 UID", trigger: "blur" }
  ],
  inspectedAt: [
    { required: true, message: "请选择检验时间", trigger: "change" }
  ]
};

function isNonNegativeInteger(value: number) {
  return Number.isInteger(value) && value >= 0;
}

function validateQuantities() {
  if (
    ![form.inspectedQty, form.qualifiedQty, form.unqualifiedQty].every(
      isNonNegativeInteger
    )
  ) {
    message("检验数量、合格数量和不合格数量都必须是不小于 0 的整数", {
      type: "warning"
    });
    return false;
  }
  if (form.qualifiedQty + form.unqualifiedQty !== form.inspectedQty) {
    message("需满足 检验数量 = 合格数量 + 不合格数量", {
      type: "warning"
    });
    return false;
  }
  if (form.result === "PASS" && form.unqualifiedQty !== 0) {
    message("合格结果下，不合格数量必须为 0", { type: "warning" });
    return false;
  }
  if (form.result === "FAIL" && form.qualifiedQty !== 0) {
    message("不合格结果下，合格数量必须为 0", { type: "warning" });
    return false;
  }
  if (
    form.result === "PARTIAL" &&
    (form.qualifiedQty === 0 || form.unqualifiedQty === 0)
  ) {
    message("部分合格结果下，合格与不合格数量都必须大于 0", {
      type: "warning"
    });
    return false;
  }
  return true;
}

async function validate() {
  const valid = await formRef.value?.validate().catch(() => false);
  return !!valid && validateQuantities();
}

function getPayload(): CreateQualityInspectionDto {
  const handler = form.handler?.trim();
  const remark = form.remark?.trim();
  return {
    purchaseOrderUid: form.purchaseOrderUid.trim(),
    ...(form.detailId ? { detailId: form.detailId } : {}),
    inspectedQty: form.inspectedQty,
    qualifiedQty: form.qualifiedQty,
    unqualifiedQty: form.unqualifiedQty,
    result: form.result,
    ...(handler ? { handler } : {}),
    inspectedAt: form.inspectedAt,
    ...(remark ? { remark } : {})
  };
}

defineExpose({
  validate,
  getPayload
});
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
    <el-form-item label="采购订单 UID" prop="purchaseOrderUid">
      <el-input
        v-model="form.purchaseOrderUid"
        placeholder="请输入采购订单 UID"
      />
    </el-form-item>

    <el-form-item label="采购明细 ID">
      <el-input-number
        v-model="form.detailId"
        :min="1"
        :precision="0"
        class="w-full"
      />
    </el-form-item>

    <div class="grid grid-cols-2 gap-3">
      <el-form-item label="检验数量">
        <el-input-number
          v-model="form.inspectedQty"
          :min="0"
          :precision="0"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="合格数量">
        <el-input-number
          v-model="form.qualifiedQty"
          :min="0"
          :precision="0"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="不合格数量">
        <el-input-number
          v-model="form.unqualifiedQty"
          :min="0"
          :precision="0"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="检验结果">
        <el-select v-model="form.result" class="w-full">
          <el-option
            v-for="item in resultOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </div>

    <el-form-item label="处理方式">
      <el-input v-model="form.handler" placeholder="可选" />
    </el-form-item>

    <el-form-item label="检验时间" prop="inspectedAt">
      <el-date-picker
        v-model="form.inspectedAt"
        type="datetime"
        value-format="YYYY-MM-DDTHH:mm:ss[Z]"
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
  </el-form>
</template>

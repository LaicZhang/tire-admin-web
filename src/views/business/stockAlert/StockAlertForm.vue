<script setup lang="ts">
import { computed, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { StockAlertDto } from "@/api/business/stock-alert";
import TireSelect from "@/components/EntitySelect/TireSelect.vue";
import { elementRules } from "@/utils/validation/elementRules";

const props = defineProps<{
  formInline: StockAlertDto;
}>();

const emit = defineEmits<{
  "update:formInline": [value: StockAlertDto];
}>();

const formData = computed({
  get: () => props.formInline,
  set: val => emit("update:formInline", val)
});

const ruleFormRef = ref<FormInstance>();

const rules: FormRules = {
  tireId: [
    elementRules.requiredSelect("请选择商品", "change"),
    elementRules.uuidV4("商品不合法", "change")
  ],
  minQuantity: [
    elementRules.requiredSelect("请输入最低库存", "blur"),
    {
      trigger: "blur",
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === "")
          return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n))
          return callback(new Error("最低库存需为不小于 0 的整数"));
        callback();
      }
    }
  ]
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="formData"
    :rules="rules"
    label-width="80px"
  >
    <el-form-item label="轮胎ID" prop="tireId">
      <TireSelect v-model="formData.tireId" placeholder="请选择商品" />
    </el-form-item>
    <el-form-item label="最低库存" prop="minQuantity">
      <el-input-number v-model="formData.minQuantity" :min="0" />
    </el-form-item>
  </el-form>
</template>

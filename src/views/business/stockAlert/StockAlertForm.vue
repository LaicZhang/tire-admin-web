<script setup lang="ts">
import { computed } from "vue";
import type { StockAlertDto } from "@/api/business/stock-alert";
import TireSelect from "@/components/EntitySelect/TireSelect.vue";

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
</script>

<template>
  <el-form :model="formData" label-width="80px">
    <el-form-item label="轮胎ID" required>
      <TireSelect v-model="formData.tireId" placeholder="请选择商品" />
    </el-form-item>
    <el-form-item label="最低库存">
      <el-input-number v-model="formData.minQuantity" :min="0" />
    </el-form-item>
  </el-form>
</template>

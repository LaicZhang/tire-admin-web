<script setup lang="ts">
import { computed } from "vue";
import type { IncomeExpenseItem } from "@/api/finance";

const props = defineProps<{
  formInline: {
    name: string;
    type: IncomeExpenseItem["type"];
    desc: string;
  };
}>();

const emit = defineEmits<{
  "update:formInline": [
    value: { name: string; type: IncomeExpenseItem["type"]; desc: string }
  ];
}>();

const formData = computed({
  get: () => props.formInline,
  set: val => emit("update:formInline", val)
});
</script>

<template>
  <el-form :model="formData" label-width="80px">
    <el-form-item label="名称" required>
      <el-input v-model="formData.name" placeholder="请输入项目名称" />
    </el-form-item>
    <el-form-item label="类型" required>
      <el-radio-group v-model="formData.type">
        <el-radio value="income">收入</el-radio>
        <el-radio value="expense">支出</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="formData.desc" type="textarea" />
    </el-form-item>
  </el-form>
</template>

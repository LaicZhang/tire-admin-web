<script setup lang="ts">
import { computed, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { IncomeExpenseItem } from "@/api/finance";
import { elementRules } from "@/utils/validation/elementRules";

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

const ruleFormRef = ref<FormInstance>();

const rules: FormRules = {
  name: [
    elementRules.requiredStringTrim("请输入项目名称"),
    elementRules.maxLen(50, "项目名称最多 50 个字符")
  ],
  type: [
    elementRules.requiredSelect("请选择类型", "change"),
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        const allowed = new Set(["income", "expense"]);
        if (!allowed.has(String(value)))
          return callback(new Error("类型不合法"));
        callback();
      }
    }
  ],
  desc: [elementRules.maxLen(200, "备注最多 200 个字符")]
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
    <el-form-item label="名称" prop="name">
      <el-input
        v-model="formData.name"
        placeholder="请输入项目名称"
        maxlength="50"
        show-word-limit
        clearable
      />
    </el-form-item>
    <el-form-item label="类型" prop="type">
      <el-radio-group v-model="formData.type">
        <el-radio value="income">收入</el-radio>
        <el-radio value="expense">支出</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="备注" prop="desc">
      <el-input
        v-model="formData.desc"
        type="textarea"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>
  </el-form>
</template>

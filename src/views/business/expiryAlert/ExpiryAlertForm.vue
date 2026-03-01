<script setup lang="ts">
import { computed, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import RepoSelect from "@/components/EntitySelect/RepoSelect.vue";
import { elementRules } from "@/utils/validation/elementRules";

const props = defineProps<{
  formInline: {
    repoId: string;
    daysBefore: number;
  };
}>();

const emit = defineEmits<{
  "update:formInline": [value: { repoId: string; daysBefore: number }];
}>();

const formData = computed({
  get: () => props.formInline,
  set: val => emit("update:formInline", val)
});

const ruleFormRef = ref<FormInstance>();

const rules: FormRules = {
  repoId: [elementRules.uuidV4("仓库不合法", "change")],
  daysBefore: [
    elementRules.requiredSelect("请输入提前预警天数", "blur"),
    elementRules.positiveInt("提前预警天数需为正整数")
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
    label-width="100px"
  >
    <el-form-item label="仓库ID（可选）" prop="repoId">
      <RepoSelect v-model="formData.repoId" clearable placeholder="全部仓库" />
    </el-form-item>
    <el-form-item label="提前预警天数" prop="daysBefore">
      <el-input-number v-model="formData.daysBefore" :min="1" />
    </el-form-item>
  </el-form>
</template>

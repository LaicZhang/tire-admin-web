<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import { elementRules } from "@/utils/validation/elementRules";

const props = defineProps({
  formInline: {
    type: Object,
    default: () => ({
      code: "",
      remark: ""
    })
  }
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  code: [elementRules.maxLen(50, "装箱单号最多 50 个字符")],
  remark: [elementRules.maxLen(200, "备注最多 200 个字符")]
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="rules"
    label-width="82px"
  >
    <el-form-item label="装箱单号" prop="code">
      <el-input
        v-model="newFormInline.code"
        clearable
        placeholder="如果不填将自动生成"
        maxlength="50"
        show-word-limit
      />
    </el-form-item>

    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="newFormInline.remark"
        type="textarea"
        placeholder="请输入备注信息"
        :rows="3"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import type { FormProps } from "./types";
import { elementRules } from "@/utils/validation/elementRules";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    type: "",
    code: "",
    name: "",
    sort: 0,
    remark: ""
  }),
  isEdit: false
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  code: [
    elementRules.requiredStringTrim("请输入编码"),
    elementRules.maxLen(50, "编码最多 50 个字符")
  ],
  name: [
    elementRules.requiredStringTrim("请输入名称"),
    elementRules.maxLen(100, "名称最多 100 个字符")
  ],
  sort: [
    {
      trigger: "blur",
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === "")
          return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n) || n < 0 || n > 9999)
          return callback(new Error("排序需在 0~9999"));
        callback();
      }
    }
  ],
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
    label-width="80px"
  >
    <el-form-item label="编码" prop="code">
      <el-input
        v-model="newFormInline.code"
        clearable
        placeholder="请输入编码"
        maxlength="50"
        :disabled="isEdit"
      />
    </el-form-item>
    <el-form-item label="名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入名称"
        maxlength="100"
      />
    </el-form-item>
    <el-form-item label="排序" prop="sort">
      <el-input-number
        v-model="newFormInline.sort"
        :min="0"
        :max="9999"
        class="!w-full"
      />
    </el-form-item>
    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="newFormInline.remark"
        type="textarea"
        :rows="3"
        placeholder="请输入备注"
        maxlength="200"
      />
    </el-form-item>
  </el-form>
</template>

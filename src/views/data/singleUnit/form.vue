<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import type { FormProps } from "./types";
import { elementRules } from "@/utils/validation/elementRules";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    symbol: "",
    isDefault: false,
    sort: 0,
    remark: ""
  }),
  isEdit: false
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  name: [
    elementRules.requiredStringTrim("请输入单位名称"),
    elementRules.maxLen(50, "单位名称最多 50 个字符")
  ],
  symbol: [
    elementRules.requiredStringTrim("请输入单位符号"),
    elementRules.maxLen(20, "单位符号最多 20 个字符")
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
    <el-form-item label="单位名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入单位名称，如：个、件、箱"
        maxlength="50"
      />
    </el-form-item>
    <el-form-item label="符号" prop="symbol">
      <el-input
        v-model="newFormInline.symbol"
        clearable
        placeholder="请输入单位符号，如：pcs、kg"
        maxlength="20"
      />
    </el-form-item>
    <el-form-item label="默认" prop="isDefault">
      <el-switch
        v-model="newFormInline.isDefault"
        inline-prompt
        active-text="是"
        inactive-text="否"
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

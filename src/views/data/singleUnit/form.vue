<script setup lang="ts">
import { ref } from "vue";
import type { FormProps } from "./types";

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

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" label-width="80px">
    <el-form-item
      label="单位名称"
      prop="name"
      :rules="[{ required: true, message: '请输入单位名称', trigger: 'blur' }]"
    >
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入单位名称，如：个、件、箱"
        maxlength="50"
      />
    </el-form-item>
    <el-form-item
      label="符号"
      prop="symbol"
      :rules="[{ required: true, message: '请输入单位符号', trigger: 'blur' }]"
    >
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

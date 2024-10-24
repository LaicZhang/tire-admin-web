<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormRules } from "element-plus";

interface FormItemProps {
  id: number;
  desc: string;
  number: string;
  tireId: string;
  isLocked: boolean;
  isInRepo: boolean;
}
interface FormProps {
  formInline: FormItemProps;
}
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    id: 0,
    tireId: "",
    number: "",
    isLocked: false,
    isInRepo: false,
    desc: ""
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  tireId: [{ required: true, message: "轮胎类型为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="轮胎" prop="tireId">
      <el-input
        v-model="newFormInline.tireId"
        clearable
        placeholder="请选择轮胎"
      />
    </el-form-item>

    <el-form-item label="轮胎胎号" prop="number">
      <el-input
        v-model="newFormInline.number"
        clearable
        placeholder="请选择轮胎胎号"
      />
    </el-form-item>

    <el-form-item label="是否锁定">
      <el-switch v-model="newFormInline.isLocked" />
    </el-form-item>

    <el-form-item label="是否在库">
      <el-switch v-model:model-value="newFormInline.isInRepo" />
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="newFormInline.desc"
        placeholder="请输入备注信息"
        type="textarea"
      />
    </el-form-item>
  </el-form>
</template>

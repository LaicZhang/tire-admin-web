<script setup lang="ts">
import { ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";

interface FormItemProps {
  /** 员工名字 */
  name: string;
  /** 员工编号 */
  id: string;
  /** 备注 */
  desc: string;
}
interface FormProps {
  formInline: FormItemProps;
}
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    id: "",
    desc: ""
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "角色名字为必填项", trigger: "blur" }],
  desc: [{ required: true, message: "角色标识为必填项", trigger: "blur" }]
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
    <el-form-item label="名字" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入名字"
      />
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

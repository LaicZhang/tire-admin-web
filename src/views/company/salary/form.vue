<script setup lang="ts">
import { ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";

interface FormItemProps {
  name: string;
  id: string;
  desc: string;
  base: number;
  performance: number;
  fulltimeAttendanceAward: number;
  subsidy: number;
}
interface FormProps {
  formInline: FormItemProps;
}
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    id: "",
    base: 0,
    performance: 0,
    fulltimeAttendanceAward: 0,
    subsidy: 0,
    desc: ""
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "角色名称为必填项", trigger: "blur" }],
  base: [{ required: true, message: "基础工资为必填项", trigger: "blur" }]
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
    <el-form-item label="名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入名称"
      />
    </el-form-item>

    <el-form-item label="基本工资" prop="base">
      <el-input
        v-model="newFormInline.base"
        clearable
        placeholder="请输入基本工资"
      />
    </el-form-item>

    <el-form-item label="绩效" prop="performance">
      <el-input
        v-model="newFormInline.performance"
        clearable
        placeholder="请输入绩效"
      />
    </el-form-item>

    <el-form-item label="全勤奖" prop="fulltimeAttendanceAward">
      <el-input
        v-model="newFormInline.fulltimeAttendanceAward"
        clearable
        placeholder="请输入全勤奖"
      />
    </el-form-item>

    <el-form-item label="补贴" prop="subsidy">
      <el-input
        v-model="newFormInline.subsidy"
        clearable
        placeholder="请输入补贴"
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

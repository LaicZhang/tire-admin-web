<script setup lang="ts">
import { ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";

interface FormItemProps {
  phone: string;
  email: string;
  username: string;
  password: string;
  name: string;
  /** 员工编号 */
  id: number;
  /** 备注 */
  desc?: string;
  nickname?: string;
}

interface FormProps {
  formInline: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    phone: "",
    email: "",
    username: "",
    password: "",
    name: "",
    nickname: "",
    id: "",
    desc: undefined
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "真实姓名为必填项", trigger: "blur" }],
  phone: [{ required: true, message: "手机号为必填项", trigger: "blur" }],
  username: [{ required: true, message: "用户名为必填项", trigger: "blur" }]
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
    <el-form-item label="真实姓名" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入真实姓名"
      />
    </el-form-item>

    <el-form-item label="手机号码" prop="phone">
      <el-input
        v-model="newFormInline.phone"
        clearable
        placeholder="请输入手机号码"
      />
    </el-form-item>

    <el-form-item label="初始密码" prop="password">
      <el-input
        v-model="newFormInline.password"
        clearable
        placeholder="请输入初始密码"
      />
    </el-form-item>

    <el-form-item label="昵称" prop="nickname">
      <el-input
        v-model="newFormInline.nickname"
        clearable
        placeholder="请输入昵称"
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

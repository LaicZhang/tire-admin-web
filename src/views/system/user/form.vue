<script setup lang="ts">
import { ref } from "vue";
import { FormProps } from "./utils/types";
import { rule } from "./rule";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    username: "",
    phone: "",
    email: "",
    password: "",
    status: "1"
  })
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
    :rules="rule"
    label-width="82px"
  >
    <el-form-item label="用户名" prop="username">
      <el-input
        v-model="newFormInline.username"
        clearable
        placeholder="请输入用户名"
      />
    </el-form-item>

    <el-form-item label="手机号" prop="phone">
      <el-input
        v-model="newFormInline.phone"
        clearable
        placeholder="请输入手机号"
      />
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input
        v-model="newFormInline.email"
        clearable
        placeholder="请输入邮箱"
      />
    </el-form-item>

    <el-form-item v-if="!newFormInline.uid" label="密码" prop="password">
      <el-input
        v-model="newFormInline.password"
        clearable
        type="password"
        placeholder="请输入密码"
        show-password
      />
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-select v-model="newFormInline.status" placeholder="请选择状态">
        <el-option label="已解决" value="1" />
        <el-option label="未解决" value="0" />
        <el-option label="解决中" value="2" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

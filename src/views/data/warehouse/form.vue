<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormProps } from "./types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    code: "",
    name: "",
    address: "",
    manager: "",
    phone: "",
    desc: "",
    status: 1
  }),
  disabled: false
});

const formRules = reactive({
  name: [{ required: true, message: "仓库名称为必填项", trigger: "blur" }]
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
    :disabled="disabled"
    label-width="100px"
  >
    <el-form-item label="仓库编码" prop="code">
      <el-input
        v-model="newFormInline.code"
        clearable
        placeholder="请输入仓库编码"
      />
    </el-form-item>

    <el-form-item label="仓库名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入仓库名称"
      />
    </el-form-item>

    <el-form-item label="地址" prop="address">
      <el-input
        v-model="newFormInline.address"
        clearable
        placeholder="请输入仓库地址"
      />
    </el-form-item>

    <el-form-item label="负责人" prop="manager">
      <el-input
        v-model="newFormInline.manager"
        clearable
        placeholder="请输入负责人姓名"
      />
    </el-form-item>

    <el-form-item label="联系电话" prop="phone">
      <el-input
        v-model="newFormInline.phone"
        clearable
        placeholder="请输入联系电话"
      />
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-select v-model="newFormInline.status" placeholder="请选择状态">
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
    </el-form-item>

    <el-form-item label="备注" prop="desc">
      <el-input
        v-model="newFormInline.desc"
        type="textarea"
        placeholder="请输入备注信息"
        :rows="3"
      />
    </el-form-item>
  </el-form>
</template>

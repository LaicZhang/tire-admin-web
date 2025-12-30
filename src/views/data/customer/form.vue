<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormProps } from "./types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    code: "",
    name: "",
    contact: "",
    phone: "",
    address: "",
    creditLimit: undefined,
    levelId: undefined,
    regionId: undefined,
    desc: ""
  }),
  disabled: false
});

const formRules = reactive({
  name: [{ required: true, message: "客户名称为必填项", trigger: "blur" }]
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
    <el-form-item label="客户编码" prop="code">
      <el-input
        v-model="newFormInline.code"
        clearable
        placeholder="请输入客户编码（可选）"
      />
    </el-form-item>

    <el-form-item label="客户名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入客户名称"
      />
    </el-form-item>

    <el-form-item label="联系人" prop="contact">
      <el-input
        v-model="newFormInline.contact"
        clearable
        placeholder="请输入联系人"
      />
    </el-form-item>

    <el-form-item label="电话" prop="phone">
      <el-input
        v-model="newFormInline.phone"
        clearable
        placeholder="请输入联系电话"
      />
    </el-form-item>

    <el-form-item label="地址" prop="address">
      <el-input
        v-model="newFormInline.address"
        clearable
        placeholder="请输入地址"
      />
    </el-form-item>

    <el-form-item label="信用额度" prop="creditLimit">
      <el-input-number
        v-model="newFormInline.creditLimit"
        :min="0"
        :precision="2"
        placeholder="信用额度"
        class="w-48"
      />
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

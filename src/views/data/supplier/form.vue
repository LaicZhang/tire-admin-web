<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormRules } from "element-plus";
import type { FormProps } from "./types";
import { fieldRules } from "@/utils/validation/fieldRules";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    code: "",
    name: "",
    contact: "",
    phone: "",
    address: "",
    bankName: "",
    bankAccount: "",
    bankInfo: "",
    desc: ""
  }),
  disabled: false
});

const formRules: FormRules = reactive({
  code: fieldRules.code({ required: false, label: "供应商编码" }),
  name: fieldRules.name({ label: "供应商名称" }),
  contact: fieldRules.name({ required: false, label: "联系人" }),
  phone: fieldRules.code({ required: false, label: "电话", max: 20 }),
  address: fieldRules.address({ required: false, label: "地址" }),
  bankName: fieldRules.name({ required: false, label: "开户行" }),
  bankAccount: fieldRules.code({ required: false, label: "银行账号" }),
  desc: fieldRules.remark({ required: false, label: "备注" })
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
    <el-form-item label="供应商编码" prop="code">
      <el-input
        v-model="newFormInline.code"
        clearable
        placeholder="请输入供应商编码（可选）"
      />
    </el-form-item>

    <el-form-item label="供应商名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入供应商名称"
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

    <el-divider content-position="left">银行账户信息</el-divider>

    <el-form-item label="开户行" prop="bankName">
      <el-input
        v-model="newFormInline.bankName"
        clearable
        placeholder="请输入开户行名称"
      />
    </el-form-item>

    <el-form-item label="银行账号" prop="bankAccount">
      <el-input
        v-model="newFormInline.bankAccount"
        clearable
        placeholder="请输入银行账号"
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

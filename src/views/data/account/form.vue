<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormProps } from "./types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    accountType: "bank",
    bankName: "",
    bankAccount: "",
    initialBalance: 0,
    desc: ""
  }),
  disabled: false
});

const formRules = reactive({
  name: [{ required: true, message: "账户名称为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const accountTypes = [
  { label: "银行账户", value: "bank" },
  { label: "现金", value: "cash" },
  { label: "支付宝", value: "alipay" },
  { label: "微信", value: "wechat" },
  { label: "其他", value: "other" }
];

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
    <el-form-item label="账户名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入账户名称"
      />
    </el-form-item>

    <el-form-item label="账户类型" prop="accountType">
      <el-select
        v-model="newFormInline.accountType"
        placeholder="请选择账户类型"
        class="w-full"
      >
        <el-option
          v-for="item in accountTypes"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

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

    <el-form-item
      v-if="!newFormInline.uid"
      label="初始余额"
      prop="initialBalance"
    >
      <el-input-number
        v-model="newFormInline.initialBalance"
        :precision="2"
        :min="0"
        placeholder="初始余额"
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

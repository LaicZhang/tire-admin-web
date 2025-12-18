<script setup lang="ts">
import { ref } from "vue";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";
import ReCol from "@/components/ReCol";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    contact: "",
    phone: "",
    address: "",
    status: 1
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
    :rules="formRules"
    label-width="82px"
  >
    <el-row :gutter="30">
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="公司名称" prop="name">
          <el-input
            v-model="newFormInline.name"
            clearable
            placeholder="请输入公司名称"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="联系人" prop="contact">
          <el-input
            v-model="newFormInline.contact"
            clearable
            placeholder="请输入联系人"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="联系电话" prop="phone">
          <el-input
            v-model="newFormInline.phone"
            clearable
            placeholder="请输入联系电话"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="newFormInline.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </re-col>
      <re-col :value="24" :xs="24" :sm="24">
        <el-form-item label="详细地址" prop="address">
          <el-input
            v-model="newFormInline.address"
            clearable
            type="textarea"
            placeholder="请输入详细地址"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>

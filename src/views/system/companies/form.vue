<script setup lang="ts">
import { ref } from "vue";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";
import ReCol from "@/components/ReCol";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    province: "",
    city: "",
    principalName: "",
    principalPhone: "",
    desc: ""
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
        <el-form-item label="省" prop="province">
          <el-input
            v-model="newFormInline.province"
            clearable
            placeholder="请输入省"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="市" prop="city">
          <el-input
            v-model="newFormInline.city"
            clearable
            placeholder="请输入市"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="负责人" prop="principalName">
          <el-input
            v-model="newFormInline.principalName"
            clearable
            placeholder="请输入负责人"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="负责人电话" prop="principalPhone">
          <el-input
            v-model="newFormInline.principalPhone"
            clearable
            placeholder="请输入负责人电话"
          />
        </el-form-item>
      </re-col>
      <re-col :value="24" :xs="24" :sm="24">
        <el-form-item label="描述" prop="desc">
          <el-input
            v-model="newFormInline.desc"
            clearable
            type="textarea"
            placeholder="请输入描述"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>

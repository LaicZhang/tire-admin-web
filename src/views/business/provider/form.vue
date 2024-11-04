<script setup lang="ts">
import { ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";

interface FormItemProps {
  id: number;
  uid: string;
  name: string;
  desc?: string;
  operatorId: string;
  isIndividual: boolean;
  isPublic: boolean;
  contactName: string;
  province: string;
  status: boolean;
}

interface FormProps {
  formInline: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    uid: undefined,
    name: undefined,
    id: undefined,
    desc: undefined,
    operatorId: undefined,
    isIndividual: false,
    isPublic: false,
    contactName: undefined,
    province: undefined,
    status: true
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "名称为必填项", trigger: "blur" }]
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
    <el-form-item label="客户名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入客户名称"
      />
    </el-form-item>

    <el-form-item label="联系人" prop="contactName">
      <el-input
        v-model="newFormInline.contactName"
        clearable
        placeholder="请输入联系人"
      />
    </el-form-item>

    <el-form-item label="省份" prop="province">
      <el-input
        v-model="newFormInline.province"
        clearable
        placeholder="请输入省份"
      />
    </el-form-item>

    <el-form-item label="操作人" prop="operatorId">
      <el-input
        v-model="newFormInline.operatorId"
        clearable
        placeholder="请输入操作人"
      />
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-switch v-model="newFormInline.status" />
    </el-form-item>

    <el-form-item label="是否公开" prop="isPublic">
      <el-switch v-model="newFormInline.isPublic" />
    </el-form-item>

    <el-form-item label="是否个人" prop="isIndividual">
      <el-switch v-model="newFormInline.isIndividual" />
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

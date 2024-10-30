<script setup lang="ts">
import { ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";

interface FormItemProps {
  uid: string;
  name: string;
  id: number;
  desc?: string;
  operatorId: string;
  level: number;
  totalTransactionAmount: number;
  isPublic: boolean;
  province: string;
  isIndividual: boolean;
  from: string;
  limit: number;
  discount: number;
}

interface FormProps {
  formInline: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    uid: "",
    name: "",
    id: 0,
    desc: undefined,
    operatorId: "",
    level: 0,
    totalTransactionAmount: 0,
    isPublic: false,
    province: "",
    isIndividual: false,
    from: "",
    limit: 0,
    discount: 10
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "角色名称为必填项", trigger: "blur" }]
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

    <el-form-item label="等级" prop="level">
      <el-input-number v-model="newFormInline.level" clearable />
    </el-form-item>

    <el-form-item label="操作人" prop="operatorId">
      <el-input
        v-model="newFormInline.operatorId"
        clearable
        placeholder="请输入操作人"
      />
    </el-form-item>

    <el-form-item label="来源" prop="from">
      <el-input
        v-model="newFormInline.from"
        clearable
        placeholder="请输入来源"
      />
    </el-form-item>

    <el-form-item label="限额" prop="limit">
      <el-input
        v-model="newFormInline.limit"
        clearable
        placeholder="请输入限额"
      />
    </el-form-item>

    <el-form-item label="折扣" prop="discount">
      <el-input
        v-model="newFormInline.discount"
        clearable
        placeholder="请输入折扣"
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

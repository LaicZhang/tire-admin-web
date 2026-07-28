<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormRules } from "element-plus";
import type { FormProps } from "./types";
import { fieldRules } from "@/utils/validation/fieldRules";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    code: "",
    name: "",
    nickname: "",
    department: "",
    position: "",
    phone: "",
    email: "",
    status: 1,
    desc: ""
  }),
  disabled: false
});

const formRules: FormRules = reactive({
  code: fieldRules.code({ required: false, label: "职员编码" }),
  name: fieldRules.name({ label: "职员姓名" }),
  nickname: fieldRules.name({ required: false, label: "昵称" }),
  department: fieldRules.name({ required: false, label: "部门" }),
  position: fieldRules.name({ required: false, label: "职位" }),
  phone: fieldRules.code({ required: false, label: "电话", max: 20 }),
  email: fieldRules.email({ required: false, label: "邮箱" }),
  status: fieldRules.select({ label: "状态" }),
  desc: fieldRules.remark({ required: false, label: "备注" })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

defineExpose({ formRef: ruleFormRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    :disabled="disabled"
    label-width="100px"
  >
    <el-form-item label="职员编码" prop="code">
      <el-input
        v-model="newFormInline.code"
        clearable
        placeholder="请输入职员编码（可选）"
      />
    </el-form-item>

    <el-form-item label="职员姓名" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入职员姓名"
      />
    </el-form-item>

    <el-form-item label="昵称" prop="nickname">
      <el-input
        v-model="newFormInline.nickname"
        clearable
        placeholder="请输入昵称"
      />
    </el-form-item>

    <el-form-item label="部门" prop="department">
      <el-input
        v-model="newFormInline.department"
        clearable
        placeholder="请输入所属部门"
      />
    </el-form-item>

    <el-form-item label="职位" prop="position">
      <el-input
        v-model="newFormInline.position"
        clearable
        placeholder="请输入职位"
      />
    </el-form-item>

    <el-form-item label="电话" prop="phone">
      <el-input
        v-model="newFormInline.phone"
        clearable
        placeholder="请输入联系电话"
      />
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input
        v-model="newFormInline.email"
        clearable
        placeholder="请输入邮箱"
      />
    </el-form-item>

    <!-- CLO-E-008: 离职不得用 status=0 裸改；主路径走员工页 layoff API -->
    <el-form-item label="状态" prop="status">
      <el-select
        v-model="newFormInline.status"
        placeholder="请选择状态"
        :disabled="disabled || Boolean(newFormInline.uid)"
      >
        <el-option label="在职" :value="1" />
      </el-select>
      <p v-if="newFormInline.uid" class="text-xs text-gray-500 mt-1 leading-5">
        离职/复职请使用「公司 → 员工管理」中的离职/复职操作（layoffAt
        真源），禁止在此用错误枚举值改状态。
      </p>
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

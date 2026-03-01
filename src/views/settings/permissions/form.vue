<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import type { UserFormProps } from "./types";
import { fieldRules } from "@/utils/validation/fieldRules";

const props = withDefaults(defineProps<UserFormProps>(), {
  formInline: () => ({
    username: "",
    phone: "",
    roleId: "",
    warehouseIds: []
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const roleOptions = ref([
  { label: "超级管理员", value: "admin" },
  { label: "管理员", value: "manager" },
  { label: "采购员", value: "purchaser" },
  { label: "销售员", value: "salesman" },
  { label: "仓管员", value: "warehouse" },
  { label: "财务", value: "finance" }
]);

const warehouseOptions = ref([
  { label: "主仓库", value: "w1" },
  { label: "分仓库A", value: "w2" },
  { label: "分仓库B", value: "w3" }
]);

const rules: FormRules = {
  username: fieldRules.username({ label: "用户名" }),
  phone: fieldRules.phone({ required: true, label: "手机号" }),
  roleId: fieldRules.select({ label: "角色" })
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="rules"
    label-width="100px"
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
      <div class="text-xs text-gray-400 mt-1">用户需使用此手机号注册账号</div>
    </el-form-item>

    <el-form-item label="角色" prop="roleId">
      <el-select
        v-model="newFormInline.roleId"
        placeholder="请选择角色"
        class="w-full"
      >
        <el-option
          v-for="item in roleOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="操作仓库">
      <el-checkbox-group v-model="newFormInline.warehouseIds">
        <el-checkbox
          v-for="item in warehouseOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-checkbox-group>
    </el-form-item>
  </el-form>
</template>

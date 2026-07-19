<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { resetPasswordApi } from "@/api/auth";
import { message } from "@/utils/message";
import { fieldRules } from "@/utils/validation/fieldRules";

const props = defineProps<{
  onSuccess: () => void;
  onClose: () => void;
}>();

const loading = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  password: "",
  newPassword: "",
  confirmPassword: ""
});

const rules: FormRules = {
  password: fieldRules.password({ label: "当前密码" }),
  newPassword: fieldRules.password({ label: "新密码" }),
  confirmPassword: [
    {
      required: true,
      trigger: "blur",
      validator: (_rule, value, callback) => {
        if (typeof value !== "string" || !value.trim()) {
          return callback(new Error("请再次输入新密码"));
        }
        if (value !== form.newPassword) {
          return callback(new Error("两次输入的新密码不一致"));
        }
        callback();
      }
    }
  ]
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  if (form.password === form.newPassword) {
    message("新密码不能与当前密码相同", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    const { code, msg } = await resetPasswordApi({
      password: form.password,
      newPassword: form.newPassword
    });
    if (code === 200) {
      message("密码修改成功", { type: "success" });
      props.onSuccess();
    } else {
      message(msg || "密码修改失败", { type: "error" });
    }
  } catch {
    message("密码修改失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="当前密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入当前密码"
          autocomplete="current-password"
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          placeholder="请输入新密码（6-18 位）"
          autocomplete="new-password"
        />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="请再次输入新密码"
          autocomplete="new-password"
        />
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mt-4">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认修改
      </el-button>
    </div>
  </div>
</template>

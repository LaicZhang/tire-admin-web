<script setup lang="ts">
import { computed, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { updateUserInfoApi } from "@/api/auth";
import { message } from "@/utils/message";
import { elementRules } from "@/utils/validation/elementRules";
import {
  buildUpdateCurrentUserInfoPayload,
  requiresCurrentPassword,
  type ProfileEditFormData
} from "./profile-edit";

const props = defineProps<{
  initialData: {
    nickname: string;
    phone: string;
    email: string;
    gender: number;
    birthday: string;
  };
  onSuccess: () => void;
  onClose: () => void;
}>();

const loading = ref(false);
const form = ref<ProfileEditFormData>({
  ...props.initialData,
  currentPassword: ""
});
const formRef = ref<FormInstance>();
const needsCurrentPassword = computed(() =>
  requiresCurrentPassword(props.initialData, form.value)
);

const rules: FormRules = {
  nickname: [elementRules.maxLen(50, "昵称最多 50 个字符")],
  phone: [elementRules.optionalPhoneCN("请输入正确的手机号")],
  email: [elementRules.optionalEmail("请输入正确的邮箱")],
  gender: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === "")
          return callback();
        if (value !== 0 && value !== 1)
          return callback(new Error("性别不合法"));
        callback();
      }
    }
  ],
  birthday: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        if (!value) return callback();
        const s = typeof value === "string" ? value : String(value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
          return callback(new Error("生日格式不正确"));
        const t = new Date(s).getTime();
        if (!Number.isFinite(t)) return callback(new Error("生日不合法"));
        callback();
      }
    }
  ],
  currentPassword: [
    {
      trigger: "blur",
      validator: (_rule, value, callback) => {
        if (!needsCurrentPassword.value) return callback();
        if (typeof value === "string" && value.trim()) return callback();
        callback(new Error("修改手机号或邮箱时请输入当前密码"));
      }
    }
  ]
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const payload = buildUpdateCurrentUserInfoPayload(
      props.initialData,
      form.value
    );
    const { code, msg } = await updateUserInfoApi(payload);
    if (code === 200) {
      message("更新成功", { type: "success" });
      props.onSuccess();
    } else {
      message(msg || "更新失败", { type: "error" });
    }
  } catch {
    message("更新失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="form.nickname"
          placeholder="请输入昵称"
          maxlength="50"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input
          v-model="form.phone"
          placeholder="请输入手机号"
          maxlength="20"
        />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" type="email" />
      </el-form-item>
      <el-form-item
        v-if="needsCurrentPassword"
        label="当前密码"
        prop="currentPassword"
      >
        <el-input
          v-model="form.currentPassword"
          type="password"
          show-password
          placeholder="修改手机号或邮箱时必填"
          autocomplete="current-password"
        />
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-radio-group v-model="form.gender">
          <el-radio :value="1">男</el-radio>
          <el-radio :value="0">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="生日" prop="birthday">
        <el-date-picker
          v-model="form.birthday"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mt-4">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        保存
      </el-button>
    </div>
  </div>
</template>

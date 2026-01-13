<script setup lang="ts">
import { ref } from "vue";
import { updateUserInfoApi } from "@/api/auth";
import { message } from "@/utils/message";

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
const form = ref({ ...props.initialData });

const handleSubmit = async () => {
  loading.value = true;
  try {
    const payload: {
      nickname?: string;
      phone?: string;
      email?: string;
      gender?: number;
      birthday?: string;
    } = {};
    if (form.value.nickname !== undefined) {
      payload.nickname = form.value.nickname;
    }
    if (form.value.phone !== undefined) {
      payload.phone = form.value.phone;
    }
    if (form.value.email !== undefined) {
      payload.email = form.value.email;
    }
    if (form.value.gender !== undefined) {
      payload.gender = form.value.gender;
    }
    if (form.value.birthday) {
      payload.birthday = form.value.birthday;
    }
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
    <el-form :model="form" label-width="80px">
      <el-form-item label="昵称">
        <el-input
          v-model="form.nickname"
          placeholder="请输入昵称"
          maxlength="50"
        />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input
          v-model="form.phone"
          placeholder="请输入手机号"
          maxlength="20"
        />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" type="email" />
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio :value="1">男</el-radio>
          <el-radio :value="0">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="生日">
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

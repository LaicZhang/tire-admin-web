<script setup lang="ts">
import { ref, reactive } from "vue";
import Motion from "../utils/motion";
import { message } from "@/utils/message";
import { updateRules } from "../utils/rule";
import type { FormInstance } from "element-plus";
import { useCaptchaCode } from "../utils/captchaCode";
import { useUserStoreHook } from "@/store/modules/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Lock from "~icons/ri/lock-fill";
import Iphone from "~icons/ep/iphone";
import User from "~icons/ri/user-3-fill";

const checked = ref(false);
const loading = ref(false);
const ruleForm = reactive({
  username: "",
  phone: "",
  captchaCode: "",
  password: "",
  repeatPassword: ""
});
const ruleFormRef = ref<FormInstance>();
const { isDisabled, text } = useCaptchaCode();
const repeatPasswordRule = [
  {
    validator: (
      _rule: unknown,
      value: string,
      callback: (error?: Error) => void
    ) => {
      if (value === "") {
        callback(new Error("请再次输入密码"));
      } else if (ruleForm.password !== value) {
        callback(new Error("两次输入的密码不一致"));
      } else {
        callback();
      }
    },
    trigger: "blur"
  }
];

const onUpdate = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  loading.value = true;

  try {
    const valid = await formEl.validate();
    if (!valid) {
      loading.value = false;
      return;
    }

    if (!checked.value) {
      loading.value = false;
      message("请勾选隐私政策", { type: "warning" });
      return;
    }

    // 模拟请求，需根据实际开发进行修改
    await new Promise(resolve => setTimeout(resolve, 2000));
    message("注册成功", { type: "success" });
  } catch {
    // 验证失败，不做处理
  } finally {
    loading.value = false;
  }
};

function onBack() {
  useCaptchaCode().end();
  useUserStoreHook().setCurrentPage(0);
}
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="ruleForm"
    :rules="updateRules"
    size="large"
  >
    <Motion>
      <el-form-item
        :rules="[
          {
            required: true,
            message: '请输入用户名',
            trigger: 'blur'
          }
        ]"
        prop="username"
      >
        <el-input
          v-model="ruleForm.username"
          clearable
          placeholder="用户名"
          :prefix-icon="useRenderIcon(User)"
        />
      </el-form-item>
    </Motion>

    <Motion :delay="100">
      <el-form-item prop="phone">
        <el-input
          v-model="ruleForm.phone"
          clearable
          placeholder="手机号"
          :prefix-icon="useRenderIcon(Iphone)"
        />
      </el-form-item>
    </Motion>

    <Motion :delay="150">
      <el-form-item prop="captchaCode">
        <div class="w-full flex justify-between">
          <el-input
            v-model="ruleForm.captchaCode"
            clearable
            placeholder="短信验证码"
            :prefix-icon="useRenderIcon('ri:shield-keyhole-line')"
          />
          <el-button
            :disabled="isDisabled"
            class="ml-2"
            @click="useCaptchaCode().start(ruleFormRef, 'phone')"
          >
            {{ text.length > 0 ? text + "秒后重试" : "获取验证码" }}
          </el-button>
        </div>
      </el-form-item>
    </Motion>

    <Motion :delay="200">
      <el-form-item prop="password">
        <el-input
          v-model="ruleForm.password"
          clearable
          show-password
          placeholder="密码"
          :prefix-icon="useRenderIcon(Lock)"
        />
      </el-form-item>
    </Motion>

    <Motion :delay="250">
      <el-form-item :rules="repeatPasswordRule" prop="repeatPassword">
        <el-input
          v-model="ruleForm.repeatPassword"
          clearable
          show-password
          placeholder="确认密码"
          :prefix-icon="useRenderIcon(Lock)"
        />
      </el-form-item>
    </Motion>

    <Motion :delay="300">
      <el-form-item>
        <el-checkbox v-model="checked"> 我已阅读并同意 </el-checkbox>
        <el-button link type="primary"> 隐私政策 </el-button>
      </el-form-item>
    </Motion>

    <Motion :delay="350">
      <el-form-item>
        <el-button
          class="w-full"
          size="default"
          type="primary"
          :loading="loading"
          @click="onUpdate(ruleFormRef)"
        >
          注册
        </el-button>
      </el-form-item>
    </Motion>

    <Motion :delay="400">
      <el-form-item>
        <el-button class="w-full" size="default" @click="onBack">
          返回
        </el-button>
      </el-form-item>
    </Motion>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import Motion from "../utils/motion";
import { message } from "@/utils/message";
import { updateRules } from "../utils/rule";
import type { FormInstance } from "element-plus";
import { useCaptchaCode } from "../utils/captchaCode";
import { useCaptcha } from "../composables/useLoginForm";
import { useUserStoreHook } from "@/store/modules/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Lock from "~icons/ri/lock-fill";
import Iphone from "~icons/ep/iphone";
import { forgetPasswordApi, getVerifyCodeApi } from "@/api";

const loading = ref(false);
const ruleForm = reactive({
  phone: "",
  graphicCaptcha: "",
  captchaCode: "",
  password: "",
  repeatPassword: ""
});
const ruleFormRef = ref<FormInstance>();
const captchaCodeCtl = useCaptchaCode();
const { isDisabled, text } = captchaCodeCtl;
const { captchaUrl, refreshCaptcha } = useCaptcha();

onMounted(() => {
  refreshCaptcha();
});

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

const sendSmsCode = async () => {
  if (!ruleForm.phone?.trim()) {
    message("请先输入手机号", { type: "warning" });
    return;
  }
  if (!ruleForm.graphicCaptcha?.trim()) {
    message("请先输入图形验证码", { type: "warning" });
    return;
  }

  await captchaCodeCtl.start(ruleFormRef.value, "phone");
  try {
    const res = await getVerifyCodeApi({
      phone: ruleForm.phone,
      type: "reset-password",
      code: ruleForm.graphicCaptcha
    });
    const { code, msg } = res;
    if (code === 200) {
      message("验证码发送成功", { type: "success" });
      ruleForm.graphicCaptcha = "";
      refreshCaptcha();
    } else {
      message(msg || "发送失败", { type: "error" });
      refreshCaptcha();
    }
  } catch {
    message("发送失败", { type: "error" });
    refreshCaptcha();
  }
};

const onUpdate = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  loading.value = true;

  try {
    const valid = await formEl.validate();
    if (!valid) {
      loading.value = false;
      return;
    }

    const res = await forgetPasswordApi(ruleForm.phone, {
      newPassword: ruleForm.password,
      code: ruleForm.captchaCode
    });
    if (res.code === 200) {
      message("密码修改成功", { type: "success" });
      onBack();
    } else {
      message(res.msg || "密码修改失败", { type: "error" });
    }
  } catch {
    // 验证失败，不做处理
  } finally {
    loading.value = false;
  }
};

function onBack() {
  captchaCodeCtl.end();
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
      <el-form-item prop="phone">
        <el-input
          v-model="ruleForm.phone"
          clearable
          placeholder="手机号码"
          :prefix-icon="useRenderIcon(Iphone)"
        />
      </el-form-item>
    </Motion>

    <Motion :delay="50">
      <el-form-item prop="graphicCaptcha">
        <div class="w-full flex justify-between items-center gap-2">
          <el-input
            v-model="ruleForm.graphicCaptcha"
            clearable
            placeholder="图形验证码"
            :prefix-icon="useRenderIcon('ri:shield-keyhole-line')"
          />
          <img
            class="h-10 cursor-pointer rounded border"
            :src="captchaUrl"
            alt="点击刷新"
            @click="refreshCaptcha"
          />
        </div>
      </el-form-item>
    </Motion>

    <Motion :delay="100">
      <el-form-item prop="captchaCode">
        <div class="w-full flex justify-between">
          <el-input
            v-model="ruleForm.captchaCode"
            clearable
            :placeholder="'短信验证码'"
            :prefix-icon="useRenderIcon('ri:shield-keyhole-line')"
          />
          <el-button :disabled="isDisabled" class="ml-2" @click="sendSmsCode()">
            {{ text.length > 0 ? text + "秒后重试" : "获取验证码" }}
          </el-button>
        </div>
      </el-form-item>
    </Motion>

    <Motion :delay="150">
      <el-form-item prop="password">
        <el-input
          v-model="ruleForm.password"
          clearable
          show-password
          placeholder="新密码"
          :prefix-icon="useRenderIcon(Lock)"
        />
      </el-form-item>
    </Motion>

    <Motion :delay="200">
      <el-form-item prop="repeatPassword" :rules="repeatPasswordRule">
        <el-input
          v-model="ruleForm.repeatPassword"
          clearable
          show-password
          placeholder="确认新密码"
          :prefix-icon="useRenderIcon(Lock)"
        />
      </el-form-item>
    </Motion>

    <Motion :delay="250">
      <el-form-item>
        <el-button
          class="w-full"
          size="default"
          type="primary"
          :loading="loading"
          @click="onUpdate(ruleFormRef)"
        >
          确认修改
        </el-button>
      </el-form-item>
    </Motion>

    <Motion :delay="300">
      <el-form-item>
        <el-button class="w-full" size="default" @click="onBack">
          返回
        </el-button>
      </el-form-item>
    </Motion>
  </el-form>
</template>

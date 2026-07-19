<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import Motion from "../utils/motion";
import { message } from "@/utils/message";
import { phoneRules } from "../utils/rule";
import type { FormInstance } from "element-plus";
import { useCaptchaCode } from "../utils/captchaCode";
import { useCaptcha } from "../composables/useLoginForm";
import { useUserStoreHook } from "@/store/modules/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Iphone from "~icons/ep/iphone";
import { completeLogin } from "@/services";
import { getVerifyCodeApi } from "@/api";

const loading = ref(false);
const ruleForm = reactive({
  phone: "",
  /** 图形验证码（发送短信前必填） */
  graphicCaptcha: "",
  /** 短信验证码（登录） */
  captchaCode: ""
});
const ruleFormRef = ref<FormInstance>();
const { isDisabled, text } = useCaptchaCode();
const { captchaUrl, refreshCaptcha } = useCaptcha();

onMounted(() => {
  refreshCaptcha();
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  loading.value = true;

  try {
    const valid = await formEl.validate();
    if (!valid) {
      loading.value = false;
      return;
    }

    const res = await useUserStoreHook().loginByUsername({
      username: ruleForm.phone,
      isRemember: useUserStoreHook().isRemember,
      code: ruleForm.captchaCode
    });
    const { code, msg } = res;
    if (code === 200) {
      await completeLogin();
      message("登录成功", { type: "success" });
    } else {
      message(msg, { type: "error" });
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      message(err.message, { type: "error" });
    }
  } finally {
    isDisabled.value = false;
    loading.value = false;
  }
};

const sendSmsCode = async () => {
  if (!ruleForm.phone?.trim()) {
    message("请先输入手机号", { type: "warning" });
    return;
  }
  if (!ruleForm.graphicCaptcha?.trim()) {
    message("请先输入图形验证码", { type: "warning" });
    return;
  }

  await useCaptchaCode().start(ruleFormRef.value, "phone");
  try {
    // LOGIN-P1-06: backend CreateVerifyDto.code is graphic captcha
    const res = await getVerifyCodeApi({
      phone: ruleForm.phone,
      type: 1,
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

function onBack() {
  useCaptchaCode().end();
  useUserStoreHook().setCurrentPage(0);
}
</script>

<template>
  <el-form ref="ruleFormRef" :model="ruleForm" :rules="phoneRules" size="large">
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
            placeholder="短信验证码"
            :prefix-icon="useRenderIcon('ri:shield-keyhole-line')"
          />
          <el-button :disabled="isDisabled" class="ml-2" @click="sendSmsCode()">
            {{ text.length > 0 ? text + "秒后重新发送" : "发送验证码" }}
          </el-button>
        </div>
      </el-form-item>
    </Motion>

    <Motion :delay="150">
      <el-form-item>
        <el-button
          class="w-full"
          size="default"
          type="primary"
          :loading="loading"
          @click="onLogin(ruleFormRef)"
        >
          登录
        </el-button>
      </el-form-item>
    </Motion>

    <Motion :delay="200">
      <el-form-item>
        <el-button class="w-full" size="default" @click="onBack">
          返回
        </el-button>
      </el-form-item>
    </Motion>
  </el-form>
</template>

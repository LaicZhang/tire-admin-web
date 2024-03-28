<script setup lang="ts">
import { ref, reactive } from "vue";
import Motion from "../utils/motion";
import { message } from "@/utils/message";
import { phoneRules } from "../utils/rule";
import type { FormInstance } from "element-plus";
import { useCaptchaCode } from "../utils/captchaCode";
import { useUserStoreHook } from "@/store/modules/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Iphone from "@iconify-icons/ep/iphone";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import { initRouter, getTopMenu } from "@/router/utils";
import { useRouter } from "vue-router";
import { getVerifyCodeApi } from "@/api/auth";

const loading = ref(false);
const ruleForm = reactive({
  phone: "",
  captchaCode: ""
});
const ruleFormRef = ref<FormInstance>();
const { isDisabled, text } = useCaptchaCode();
const router = useRouter();

const onLogin = async (formEl: FormInstance | undefined) => {
  loading.value = true;
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.phone,
          isRemember: true,
          code: ruleForm.captchaCode
        })
        .then(res => {
          if (res.code === 200) {
            useCurrentCompanyStoreHook().handleCurrentCompany();
            initRouter().then(() => {
              router.push(getTopMenu(true).path);
              message("登录成功", { type: "success" });
            });
          } else {
            message(res.message, { type: "error" });
          }
        })
        .finally(() => {
          isDisabled.value = false;
          loading.value = false;
        });
    } else {
      loading.value = false;
      return fields;
    }
  });
};

const sendSmsCode = () => {
  useCaptchaCode().start(ruleFormRef.value, "phone");
  getVerifyCodeApi({ phone: ruleForm.phone, type: 1 }).then(res => {
    if (res.code === 200) {
      message("验证码发送成功", { type: "success" });
    } else {
      message(res.message, { type: "error" });
    }
  });
};

function onBack() {
  useCaptchaCode().end();
  useUserStoreHook().SET_CURRENT_PAGE(0);
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

    <Motion :delay="100">
      <el-form-item prop="captchaCode">
        <div class="w-full flex justify-between">
          <el-input
            v-model="ruleForm.captchaCode"
            clearable
            placeholder="验证码"
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

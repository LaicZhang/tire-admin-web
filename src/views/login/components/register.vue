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
    validator: (rule, value, callback) => {
      if (value === "") {
        callback(new Error("login.passwordSureReg"));
      } else if (ruleForm.password !== value) {
        callback(new Error("login.passwordDifferentReg"));
      } else {
        callback();
      }
    },
    trigger: "blur"
  }
];

const onUpdate = async (formEl: FormInstance | undefined) => {
  loading.value = true;
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      if (checked.value) {
        // 模拟请求，需根据实际开发进行修改
        setTimeout(() => {
          message("login.registerSuccess", {
            type: "success"
          });
          loading.value = false;
        }, 2000);
      } else {
        loading.value = false;
        message("login.tickPrivacy", { type: "warning" });
      }
    } else {
      loading.value = false;
    }
  });
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
            message: 'login.usernameReg',
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
          placeholder="t('login.phone')"
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
            placeholder="t('login.smsCaptchaCode')"
            :prefix-icon="useRenderIcon('ri:shield-keyhole-line')"
          />
          <el-button
            :disabled="isDisabled"
            class="ml-2"
            @click="useCaptchaCode().start(ruleFormRef, 'phone')"
          >
            {{ text.length > 0 ? text + "login.info" : "login.getCaptchaCode" }}
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
          placeholder="t('login.password')"
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
          placeholder="t('login.sure')"
          :prefix-icon="useRenderIcon(Lock)"
        />
      </el-form-item>
    </Motion>

    <Motion :delay="300">
      <el-form-item>
        <el-checkbox v-model="checked">
          {{ "login.readAccept" }}
        </el-checkbox>
        <el-button link type="primary">
          {{ "login.privacyPolicy" }}
        </el-button>
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
          登录
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

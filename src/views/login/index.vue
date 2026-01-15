<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { useNav } from "@/layout/hooks/useNav";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { addPathMatch } from "@/router/utils";
import { bgPng, bgWebp, avatar, illustration } from "./utils/static";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { ref, toRaw, onMounted, computed } from "vue";
import { useEventListener } from "@vueuse/core";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { setToken } from "@/utils/auth";
import {
  useCaptcha,
  useRememberLogin,
  useLoginForm
} from "./composables/useLoginForm";

import { IconifyIconOnline } from "@/components/ReIcon";
import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";
import Info from "~icons/ri/information-line";
import phone from "./components/phone.vue";
import qrCode from "./components/qrCode.vue";
import register from "./components/register.vue";
import forget from "./components/update.vue";
import { operates, thirdParty } from "./utils/enums";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import { usePermissionStoreHook } from "@/store/modules/permission";

defineOptions({
  name: "Login"
});

const router = useRouter();
const ruleFormRef = ref<FormInstance>();
const showThirdPartyLogin = ref(true);

// 使用 composables
const { captchaUrl, refreshCaptcha } = useCaptcha();
const { checked, loginDay } = useRememberLogin();
const { loading, disabled, ruleForm, githubLoading, handleGithubLogin } =
  useLoginForm();

// 同步 isRemember 到 ruleForm
ruleForm.isRemember = checked.value;

const { initStorage } = useLayout();
initStorage();

const { dataTheme, dataThemeChange } = useDataThemeChange();
dataThemeChange();
const { title } = useNav();

const currentPage = computed(() => {
  return useUserStoreHook().currentPage;
});
const onLogin = async (formEl: FormInstance | undefined) => {
  loading.value = true;
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      useUserStoreHook()
        .loginByUsername(ruleForm)
        .then(res => {
          const { code, msg, data } = res;
          if (code === 200) {
            // 全部采取静态路由模式
            usePermissionStoreHook().handleWholeMenus([]);
            useCurrentCompanyStoreHook().handleCurrentCompany();
            addPathMatch();
            message("登录成功", { type: "success" });
            router.push("/");
          } else {
            message(msg, { type: "error" });
          }
        })
        .catch(err => {
          message(err.message, { type: "error" });
        })
        .finally(() => {
          disabled.value = false;
        });
    }
    loading.value = false;
  });
};

function onkeydown({ code }: KeyboardEvent) {
  if (code === "Enter") {
    onLogin(ruleFormRef.value);
  }
}

// 使用 VueUse 的 useEventListener 自动处理事件清理
useEventListener(document, "keydown", onkeydown, { passive: true });

const onThirdPartyLogin = (icon: string) => {
  if (icon === "github") {
    if (githubLoading.value) return;
    handleGithubLogin()
      .then(data => {
        if (data && data.accessToken) {
          setToken(data);
          usePermissionStoreHook().handleWholeMenus([]);
          useCurrentCompanyStoreHook().handleCurrentCompany();
          addPathMatch();
          message("登录成功", { type: "success" });
          router.push("/");
        }
      })
      .catch(err => {
        message(err.message, { type: "error" });
      });
  }
};

onMounted(() => {
  // 初始化加载后端验证码
  refreshCaptcha();
});
</script>

<template>
  <div
    v-loading.fullscreen.lock="githubLoading"
    class="select-none"
    element-loading-text="正在进行 GitHub 授权..."
    element-loading-background="rgba(0, 0, 0, 0.7)"
    element-loading-custom-class="oauth-loading-overlay"
  >
    <picture>
      <source :srcset="bgWebp" type="image/webp" />
      <img loading="lazy" :src="bgPng" class="wave" />
    </picture>
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="() => dataThemeChange()"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-none">{{ title }}</h2>
          </Motion>

          <el-form
            v-if="currentPage === 0"
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: '请输入账号',
                    trigger: 'blur'
                  }
                ]"
                prop="username"
              >
                <el-input
                  v-model="ruleForm.username"
                  clearable
                  placeholder="用户名/手机号/账号"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
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

            <!-- <Motion :delay="200">
              <el-form-item prop="captchaCode">
                <el-input v-model="ruleForm.code" clearable placeholder="验证码"
                  :prefix-icon="useRenderIcon('ri:shield-keyhole-line')">
                  <template v-slot:append>
                    <img :src="captchaUrl" alt="点击刷新" @click="refreshCaptcha" />
                  </template>
</el-input>
</el-form-item>
</Motion> -->
            <Motion :delay="200">
              <el-form-item prop="captchaCode">
                <el-input
                  v-model="ruleForm.captchaCode"
                  clearable
                  placeholder="验证码"
                  :prefix-icon="useRenderIcon('ri:shield-keyhole-line')"
                >
                  <template v-slot:append>
                    <img
                      :src="captchaUrl"
                      alt="点击刷新"
                      class="cursor-pointer h-[32px]"
                      @click="refreshCaptcha"
                    />
                  </template>
                </el-input>
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-form-item>
                <div class="w-full h-[20px] flex justify-between items-center">
                  <el-checkbox v-model="checked">
                    <span class="flex">
                      <select
                        v-model="loginDay"
                        :style="{
                          width: loginDay < 10 ? '10px' : '16px',
                          outline: 'none',
                          background: 'none',
                          appearance: 'none'
                        }"
                      >
                        <option value="1">1</option>
                        <option value="7">7</option>
                        <option value="30">30</option>
                      </select>
                      天内免登录
                      <el-tooltip
                        effect="dark"
                        placement="top"
                        content="勾选并登录后，规定天数内无需再次登录"
                      >
                        <IconifyIconOffline :icon="Info" class="ml-1" />
                      </el-tooltip>
                    </span>
                  </el-checkbox>
                  <el-button
                    link
                    type="primary"
                    @click="useUserStoreHook().setCurrentPage(4)"
                  >
                    忘记密码？
                  </el-button>
                </div>
                <el-button
                  class="w-full mt-4"
                  size="default"
                  type="primary"
                  :loading="loading"
                  :disabled="disabled || githubLoading"
                  @click="onLogin(ruleFormRef)"
                >
                  登录
                </el-button>
              </el-form-item>
            </Motion>
          </el-form>
          <Motion v-if="currentPage === 0" :delay="350">
            <el-form-item>
              <div class="w-full h-[20px] flex justify-between items-center">
                <el-button
                  v-for="(item, index) in operates"
                  :key="index"
                  class="w-full mt-4"
                  size="default"
                  @click="useUserStoreHook().setCurrentPage(index + 1)"
                >
                  {{ item.title }}
                </el-button>
              </div>
            </el-form-item>

            <el-form-item v-if="showThirdPartyLogin">
              <el-divider>
                <p class="text-gray-500 text-xs">第三方登录</p>
              </el-divider>
              <div class="w-full flex justify-evenly">
                <template v-for="(item, index) in thirdParty" :key="index">
                  <el-tooltip
                    v-if="item.icon === 'github'"
                    content="仅限管理员登录"
                    placement="top"
                    :disabled="githubLoading"
                  >
                    <span
                      class="github-btn"
                      :class="{ 'is-disabled': githubLoading }"
                      :title="item.title"
                      @click="!githubLoading && onThirdPartyLogin(item.icon)"
                    >
                      <IconifyIconOnline
                        v-if="githubLoading"
                        icon="ri:loader-4-line"
                        width="20"
                        class="animate-spin text-blue-400"
                      />
                      <IconifyIconOnline
                        v-else
                        :icon="`ri:${item.icon}-fill`"
                        width="20"
                        class="cursor-pointer text-gray-500 transition-colors"
                      />
                    </span>
                  </el-tooltip>
                  <span
                    v-else
                    :title="item.title"
                    @click="onThirdPartyLogin(item.icon)"
                  >
                    <IconifyIconOnline
                      :icon="`ri:${item.icon}-fill`"
                      width="20"
                      class="cursor-pointer text-gray-500 hover:text-blue-400"
                    />
                  </span>
                </template>
              </div>
            </el-form-item>
          </Motion>
          <!-- 手机号登录 -->
          <phone v-if="currentPage === 1" />
          <!-- 二维码登录 -->
          <qrCode v-if="currentPage === 2" />
          <!-- 注册 -->
          <register v-if="currentPage === 3" />
          <!-- 忘记密码 -->
          <forget v-if="currentPage === 4" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}
</style>

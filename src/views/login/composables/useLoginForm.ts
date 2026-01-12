import { ref, reactive, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { baseUrlApi } from "@/api/utils";
import { useUserStoreHook } from "@/store/modules/user";

/**
 * 验证码逻辑 composable
 */
export function useCaptcha() {
  const captchaUrl = ref("");
  const captchaTimestamp = ref(Date.now());

  // 刷新后端验证码（原始函数）
  const doRefreshCaptcha = () => {
    captchaTimestamp.value = Date.now();
    // 使用 URL 对象安全拼接验证码 URL
    const url = new URL(baseUrlApi("/verify/captcha"), window.location.origin);
    url.searchParams.set("t", captchaTimestamp.value.toString());
    captchaUrl.value = url.toString();
  };

  // 使用防抖避免频繁刷新（500ms 间隔）
  const refreshCaptcha = useDebounceFn(doRefreshCaptcha, 500);

  return {
    captchaUrl,
    captchaTimestamp,
    refreshCaptcha
  };
}

/**
 * 记住登录 composable
 */
export function useRememberLogin() {
  const checked = ref(true);
  type LoginDayOption = 1 | 7 | 30;
  const loginDay = ref<LoginDayOption>(7);

  watch(checked, bool => {
    useUserStoreHook().setIsRemembered(bool);
  });

  watch(loginDay, value => {
    useUserStoreHook().setLoginDay(value);
  });

  return {
    checked,
    loginDay
  };
}

/**
 * 登录表单 composable
 */
export function useLoginForm() {
  const loading = ref(false);
  const disabled = ref(false);

  const ruleForm = reactive({
    username: "",
    password: "",
    captchaCode: "",
    isRemember: true
  });

  return {
    loading,
    disabled,
    ruleForm
  };
}

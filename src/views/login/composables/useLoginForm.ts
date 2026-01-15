import { ref, reactive, watch, onUnmounted } from "vue";
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
  const githubLoading = ref(false);
  const disabled = ref(false);

  const ruleForm = reactive({
    username: "",
    password: "",
    captchaCode: "",
    isRemember: true
  });

  let cleanupFn: (() => void) | null = null;

  interface GithubLoginResponse {
    accessToken?: string;
    error?: string;
  }

  const handleGithubLogin = () => {
    return new Promise<GithubLoginResponse>((resolve, reject) => {
      if (githubLoading.value) return;
      githubLoading.value = true;

      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      const url = "/api/auth/github";

      const popup = window.open(
        url,
        "github-login",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      let checkClosedTimer: ReturnType<typeof setInterval> | null = null;
      let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (checkClosedTimer) clearInterval(checkClosedTimer);
        if (timeoutTimer) clearTimeout(timeoutTimer);
        window.removeEventListener("message", handleMessage);
        githubLoading.value = false;
        cleanupFn = null;
      };

      cleanupFn = cleanup;

      const handleMessage = (event: MessageEvent) => {
        const data = event.data;
        if (data?.accessToken) {
          cleanup();
          resolve(data);
        } else if (data?.error) {
          cleanup();
          reject(new Error(data.error));
        }
      };

      window.addEventListener("message", handleMessage);

      // 30s timeout
      timeoutTimer = setTimeout(() => {
        cleanup();
        if (popup && !popup.closed) popup.close();
        reject(new Error("登录超时，请重试"));
      }, 30000);

      // Detect popup close
      checkClosedTimer = setInterval(() => {
        if (popup && popup.closed) {
          cleanup();
          reject(new Error("用户取消登录"));
        }
      }, 1000);
    });
  };

  onUnmounted(() => {
    if (cleanupFn) cleanupFn();
  });

  return {
    loading,
    githubLoading,
    disabled,
    ruleForm,
    handleGithubLogin
  };
}

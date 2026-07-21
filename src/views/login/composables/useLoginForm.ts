import { ref, reactive, watch, getCurrentScope, onScopeDispose } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { baseUrlApi } from "@/api/utils";
import { useUserStoreHook } from "@/store/modules/user";
import { isObject } from "@/utils/type-guards";
import type { SetTokenPayload } from "@/utils/auth";

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
  // FSW-006: default off on shared devices
  const checked = ref(false);
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
    isRemember: false
  });

  let cleanupFn: (() => void) | null = null;

  function parseGithubLoginMessage(
    data: unknown
  ): { payload?: SetTokenPayload; error?: string } | null {
    if (!isObject(data)) return null;
    const record = data as Record<string, unknown>;

    // FSW-007: require explicit message type (ignore random postMessage)
    const messageType = record.type;
    if (
      messageType !== "github-login" &&
      messageType !== "github-login-result"
    ) {
      // Nested envelope may still carry type on outer or inner
      if (isObject(record.data)) {
        return parseGithubLoginMessage(record.data);
      }
      return null;
    }

    // Support { type, data: {...} } envelope
    if (isObject(record.data) && !record.accessToken) {
      return parseGithubLoginMessage({
        type: messageType,
        ...(record.data as Record<string, unknown>)
      });
    }

    const error = record.error;
    if (typeof error === "string" && error.trim()) {
      return { error: error.trim() };
    }

    const accessToken = record.accessToken;
    if (typeof accessToken !== "string" || !accessToken.trim()) return null;

    const refreshToken =
      typeof record.refreshToken === "string" ? record.refreshToken : undefined;
    const username =
      typeof record.username === "string" ? record.username : undefined;
    const uid = typeof record.uid === "string" ? record.uid : undefined;
    const nickname =
      typeof record.nickname === "string" ? record.nickname : undefined;
    const avatar =
      typeof record.avatar === "string" ? record.avatar : undefined;

    const roles = Array.isArray(record.roles)
      ? (record.roles.filter(
          (r): r is string => typeof r === "string"
        ) as string[])
      : undefined;
    // PA-008: ignore third-party message permissions; only token/identity fields.

    const expiresRaw = record.expires;
    const expires =
      expiresRaw instanceof Date
        ? expiresRaw
        : typeof expiresRaw === "string" || typeof expiresRaw === "number"
          ? new Date(expiresRaw)
          : undefined;

    const payload: SetTokenPayload = {
      accessToken: accessToken.trim(),
      // PA-008: never accept permissions from postMessage; initRouter overwrites authz.
      permissions: [],
      ...(refreshToken ? { refreshToken } : {}),
      ...(expires && !Number.isNaN(expires.getTime()) ? { expires } : {}),
      ...(roles ? { roles } : {}),
      ...(username ? { username } : {}),
      ...(uid ? { uid } : {}),
      ...(nickname ? { nickname } : {}),
      ...(avatar ? { avatar } : {})
    };

    return { payload };
  }

  const handleGithubLogin = () => {
    return new Promise<SetTokenPayload>((resolve, reject) => {
      if (githubLoading.value) return;
      githubLoading.value = true;

      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      const url = baseUrlApi("/auth/github");

      const popup = window.open(
        url,
        "github-login",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        githubLoading.value = false;
        reject(new Error("登录窗口打开失败，请检查浏览器弹窗设置"));
        return;
      }

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
        if (event.origin !== window.location.origin) return;
        if (event.source !== popup) return;
        const parsed = parseGithubLoginMessage(event.data);
        if (!parsed) return;

        if (parsed.payload) {
          cleanup();
          resolve(parsed.payload);
          return;
        }

        if (parsed.error) {
          cleanup();
          reject(new Error(parsed.error));
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

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (cleanupFn) cleanupFn();
    });
  }

  return {
    loading,
    githubLoading,
    disabled,
    ruleForm,
    handleGithubLogin
  };
}

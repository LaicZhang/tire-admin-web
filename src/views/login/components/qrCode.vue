<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Motion from "../utils/motion";
import ReQrcode from "@/components/ReQrcode";
import { useUserStoreHook } from "@/store/modules/user";
import { getWxQrLoginUrlApi, wxQrCallbackApi } from "@/api/auth";
import { message } from "@/utils";
import { useRouter } from "vue-router";
import { addPathMatch } from "@/router/utils";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import { setToken } from "@/utils/auth";

const router = useRouter();
const qrContent = ref("");
const loading = ref(false);
const expired = ref(false);
const polling = ref(false);

let state = "";
let pollTimer: ReturnType<typeof setInterval> | null = null;
let expireTimer: ReturnType<typeof setTimeout> | null = null;

// 获取微信扫码登录 URL
async function fetchQrLoginUrl() {
  loading.value = true;
  expired.value = false;
  try {
    const { code, data, msg } = await getWxQrLoginUrlApi();
    if (code === 200 && data) {
      const result = data as {
        authUrl: string;
        state: string;
        expiresIn: number;
      };
      // 二维码内容为授权 URL
      qrContent.value = result.authUrl;
      state = result.state;

      // 设置过期定时器
      if (expireTimer) clearTimeout(expireTimer);
      expireTimer = setTimeout(
        () => {
          expired.value = true;
          stopPolling();
        },
        (result.expiresIn - 10) * 1000
      ); // 提前 10 秒标记过期

      // 开始轮询检查登录状态
      startPolling();
    } else {
      message(msg || "获取二维码失败", { type: "error" });
    }
  } catch (e) {
    console.error("获取微信扫码登录URL失败", e);
    message("获取二维码失败，请稍后重试", { type: "error" });
  } finally {
    loading.value = false;
  }
}

// 轮询检查登录状态
function startPolling() {
  if (polling.value) return;
  polling.value = true;

  pollTimer = setInterval(async () => {
    if (!state || expired.value) {
      stopPolling();
      return;
    }

    try {
      // 注意：这里需要后端提供一个状态检查接口
      // 当前实现假设用户扫码后会触发回调，前端通过 URL 参数接收
      // 如果后端支持轮询状态检查，可以在这里调用
    } catch {
      // 忽略轮询错误
    }
  }, 2000);
}

function stopPolling() {
  polling.value = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// 刷新二维码
function refreshQr() {
  stopPolling();
  fetchQrLoginUrl();
}

// 检查 URL 参数中是否有回调结果
async function checkUrlCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const urlState = urlParams.get("state");

  if (code && urlState) {
    loading.value = true;
    try {
      const {
        code: resCode,
        data,
        msg
      } = await wxQrCallbackApi({
        code,
        state: urlState,
        isRemember: true
      });

      if (resCode === 200 && data) {
        setToken(data);
        usePermissionStoreHook().handleWholeMenus([]);
        useCurrentCompanyStoreHook().handleCurrentCompany();
        addPathMatch();
        message("登录成功", { type: "success" });
        // 清除 URL 参数
        window.history.replaceState({}, "", window.location.pathname);
        router.push("/");
      } else {
        message(msg || "登录失败", { type: "error" });
      }
    } catch (e) {
      console.error("微信扫码登录失败", e);
      message("登录失败，请重试", { type: "error" });
    } finally {
      loading.value = false;
    }
  }
}

onMounted(() => {
  checkUrlCallback();
  fetchQrLoginUrl();
});

onUnmounted(() => {
  stopPolling();
  if (expireTimer) {
    clearTimeout(expireTimer);
    expireTimer = null;
  }
});
</script>

<template>
  <Motion class="-mt-2 -mb-2">
    <div class="flex flex-col items-center">
      <div
        v-if="loading"
        class="w-[200px] h-[200px] flex items-center justify-center"
      >
        <el-icon class="is-loading" :size="40">
          <i class="el-icon-loading" />
        </el-icon>
      </div>
      <div v-else-if="expired" class="relative">
        <ReQrcode :text="qrContent" :width="200" class="opacity-30" />
        <div
          class="absolute inset-0 flex flex-col items-center justify-center bg-white/80 cursor-pointer"
          @click="refreshQr"
        >
          <el-icon :size="32" class="text-gray-500 mb-2">
            <i class="el-icon-refresh" />
          </el-icon>
          <span class="text-gray-600 text-sm">二维码已过期</span>
          <span class="text-primary text-sm">点击刷新</span>
        </div>
      </div>
      <ReQrcode v-else :text="qrContent || 'loading'" :width="200" />
    </div>
  </Motion>
  <Motion :delay="100">
    <el-divider>
      <p class="text-gray-500 text-xs">使用微信扫码登录</p>
    </el-divider>
  </Motion>
  <Motion :delay="150">
    <el-button
      class="w-full mt-4"
      @click="useUserStoreHook().setCurrentPage(0)"
    >
      返回
    </el-button>
  </Motion>
</template>

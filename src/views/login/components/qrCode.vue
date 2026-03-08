<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Motion from "../utils/motion";
import ReQrcode from "@/components/ReQrcode";
import { useUserStoreHook } from "@/store/modules/user";
import { getWxQrLoginUrlApi, wxQrCallbackApi } from "@/api/auth";
import { message, authLogger } from "@/utils";
import { completeLogin } from "@/services";
import type { SetTokenPayload } from "@/utils/auth";

const qrContent = ref("");
const loading = ref(false);
const expired = ref(false);

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

      // 设置过期定时器
      if (expireTimer) clearTimeout(expireTimer);
      expireTimer = setTimeout(
        () => {
          expired.value = true;
        },
        (result.expiresIn - 10) * 1000
      ); // 提前 10 秒标记过期
    } else {
      message(msg || "获取二维码失败", { type: "error" });
    }
  } catch (e) {
    authLogger.error("获取微信扫码登录URL失败", e);
    message("获取二维码失败，请稍后重试", { type: "error" });
  } finally {
    loading.value = false;
  }
}

// 刷新二维码
function refreshQr() {
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
        // 清除 URL 参数
        window.history.replaceState({}, "", window.location.pathname);
        await completeLogin(data as unknown as SetTokenPayload);
        message("登录成功", { type: "success" });
      } else {
        message(msg || "登录失败", { type: "error" });
      }
    } catch (e) {
      authLogger.error("微信扫码登录失败", e);
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

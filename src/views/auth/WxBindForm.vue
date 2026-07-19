<script setup lang="ts">
import { ref } from "vue";
import { Loading } from "@element-plus/icons-vue";
import ReQrcode from "@/components/ReQrcode";

const props = defineProps<{
  /** 微信开放平台授权 URL，用于生成扫码二维码 */
  authUrl: string;
  /** 与 QR state 配套的当前密码（完成绑定时回传） */
  currentPassword: string;
  state: string;
}>();

const emit = defineEmits<{
  (e: "check"): void;
  (e: "close"): void;
  (e: "complete", payload: { code: string; state: string; currentPassword: string }): void;
}>();

const oauthCode = ref("");
const completing = ref(false);

const handleComplete = async () => {
  const code = oauthCode.value.trim();
  if (!code) return;
  completing.value = true;
  try {
    emit("complete", {
      code,
      state: props.state,
      currentPassword: props.currentPassword
    });
  } finally {
    completing.value = false;
  }
};
</script>

<template>
  <div>
    <div class="text-center">
      <p class="mb-4">请使用微信扫描二维码完成绑定</p>
      <!--
        PC/Web 绑定使用 POST /auth/wx-qr/bind（body: code, state, currentPassword）。
        二维码内容为 open.weixin.qq.com 授权 URL（getWxQrLoginUrlApi.authUrl）；
        后端用同一 WX_QR_LOGIN_STATE 校验 state。扫码后若回调落到本机，
        可把授权码填入下方以完成绑定；也可用「已扫码」轮询绑定状态。
      -->
      <div v-if="authUrl" class="flex justify-center">
        <ReQrcode :text="authUrl" :width="192" />
      </div>
      <div
        v-else
        class="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100 rounded"
      >
        <el-icon class="text-4xl text-gray-300 is-loading"><Loading /></el-icon>
      </div>
      <p class="text-xs text-gray-400 mt-4">二维码有效期约 5 分钟</p>
    </div>

    <el-form class="mt-4" label-width="80px" @submit.prevent>
      <el-form-item label="授权码">
        <el-input
          v-model="oauthCode"
          placeholder="扫码授权后可粘贴 code 完成绑定（可选）"
          clearable
        />
      </el-form-item>
    </el-form>

    <div class="flex justify-end gap-2 mt-2">
      <el-button @click="emit('close')">取消</el-button>
      <el-button @click="emit('check')">已扫码</el-button>
      <el-button
        type="primary"
        :loading="completing"
        :disabled="!oauthCode.trim()"
        @click="handleComplete"
      >
        确认绑定
      </el-button>
    </div>
  </div>
</template>

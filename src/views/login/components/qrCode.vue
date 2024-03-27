<script setup lang="ts">
import Motion from "../utils/motion";
import ReQrcode from "@/components/ReQrcode";
import { useUserStoreHook } from "@/store/modules/user";
</script>

<template>
  <Motion class="-mt-2 -mb-2"> <ReQrcode :text="'login.test'" /> </Motion>
  <Motion :delay="100">
    <el-divider>
      <p class="text-gray-500 text-xs">扫码后点击确认即可登录</p>
    </el-divider>
  </Motion>
  <Motion :delay="150">
    <el-button
      class="w-full mt-4"
      @click="useUserStoreHook().SET_CURRENT_PAGE(0)"
    >
      返回
    </el-button>
  </Motion>
</template>

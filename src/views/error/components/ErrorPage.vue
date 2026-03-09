<script setup lang="ts">
import { useRouter } from "vue-router";
import type { Component } from "vue";
import { resolveSafeHomeRoute, safeNavigate } from "@/router/utils";

defineProps<{
  code: string;
  message: string;
  icon: Component;
}>();

const router = useRouter();

function handleHome() {
  void safeNavigate(router, resolveSafeHomeRoute(router), {
    replace: true,
    silent: true,
    fallback: { path: "/login" }
  });
}

function handleBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  handleHome();
}

function handleReload() {
  window.location.reload();
}
</script>

<template>
  <div class="flex justify-center items-center h-[640px]">
    <component :is="icon" />
    <div class="ml-12">
      <p
        v-motion
        class="font-medium text-4xl mb-4 dark:text-white"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 80
          }
        }"
      >
        {{ code }}
      </p>
      <p
        v-motion
        class="mb-4 text-gray-500"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 120
          }
        }"
      >
        {{ message }}
      </p>
      <div class="flex gap-3 flex-wrap">
        <el-button
          v-motion
          type="primary"
          :initial="{
            opacity: 0,
            y: 100
          }"
          :enter="{
            opacity: 1,
            y: 0,
            transition: {
              delay: 160
            }
          }"
          @click="handleHome"
        >
          返回首页
        </el-button>
        <el-button
          v-motion
          :initial="{
            opacity: 0,
            y: 100
          }"
          :enter="{
            opacity: 1,
            y: 0,
            transition: {
              delay: 200
            }
          }"
          @click="handleBack"
        >
          返回上一页
        </el-button>
        <el-button
          v-motion
          :initial="{
            opacity: 0,
            y: 100
          }"
          :enter="{
            opacity: 1,
            y: 0,
            transition: {
              delay: 240
            }
          }"
          @click="handleReload"
        >
          刷新重试
        </el-button>
      </div>
    </div>
  </div>
</template>

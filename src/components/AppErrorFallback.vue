<script setup lang="ts">
import serverError from "@/assets/status/500.svg?component";

withDefaults(
  defineProps<{
    title: string;
    message: string;
    detail?: string;
    showBack?: boolean;
    showHome?: boolean;
    showReload?: boolean;
  }>(),
  {
    detail: "",
    showBack: true,
    showHome: true,
    showReload: true
  }
);

defineEmits<{
  back: [];
  home: [];
  reload: [];
}>();
</script>

<template>
  <div class="app-error-fallback">
    <div class="app-error-card">
      <component :is="serverError" class="app-error-icon" />
      <h1 class="app-error-title">{{ title }}</h1>
      <p class="app-error-message">{{ message }}</p>
      <p v-if="detail" class="app-error-detail">{{ detail }}</p>
      <div class="app-error-actions">
        <button
          v-if="showBack"
          type="button"
          class="app-error-button app-error-button-secondary"
          @click="$emit('back')"
        >
          返回上一页
        </button>
        <button
          v-if="showHome"
          type="button"
          class="app-error-button app-error-button-primary"
          @click="$emit('home')"
        >
          返回首页
        </button>
        <button
          v-if="showReload"
          type="button"
          class="app-error-button app-error-button-secondary"
          @click="$emit('reload')"
        >
          刷新重试
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--el-bg-color-page, #f5f7fa);
}

.app-error-card {
  width: min(100%, 720px);
  padding: 40px 32px;
  text-align: center;
  background: var(--el-bg-color, #fff);
  border-radius: 20px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 8%);
}

.app-error-icon {
  max-width: 220px;
  margin: 0 auto 24px;
}

.app-error-title {
  margin-bottom: 12px;
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2937);
}

.app-error-message {
  margin-bottom: 12px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--el-text-color-regular, #4b5563);
}

.app-error-detail {
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary, #6b7280);
  text-align: left;
  overflow-wrap: anywhere;
  background: var(--el-fill-color-light, #f3f4f6);
  border-radius: 12px;
}

.app-error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.app-error-button {
  min-width: 120px;
  padding: 10px 18px;
  font-size: 14px;
  line-height: 1.2;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 9999px;
  transition: all 0.2s ease;
}

.app-error-button-primary {
  color: #fff;
  background: var(--el-color-primary, #409eff);
}

.app-error-button-primary:hover {
  opacity: 0.92;
}

.app-error-button-secondary {
  color: var(--el-text-color-primary, #1f2937);
  background: transparent;
  border-color: var(--el-border-color, #dcdfe6);
}

.app-error-button-secondary:hover {
  background: var(--el-fill-color-light, #f3f4f6);
}
</style>

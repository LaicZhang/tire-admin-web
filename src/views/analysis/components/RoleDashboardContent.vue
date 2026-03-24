<script setup lang="ts">
import { useRouter } from "vue-router";
import type { RoleDashboardCard, RoleDashboardData } from "@/api/dashboard";
import RoleDashboardSection from "./RoleDashboardSection.vue";

defineOptions({
  name: "RoleDashboardContent"
});

const props = defineProps<{
  data: RoleDashboardData | null;
  loading?: boolean;
}>();

const router = useRouter();

function formatCardValue(card: RoleDashboardCard) {
  if (card.key.includes("amount") || card.key.includes("value")) {
    return `¥${card.value}`;
  }
  return card.value;
}

function navigate(targetPath?: string) {
  if (!targetPath) return;
  router.push(targetPath);
}
</script>

<template>
  <div v-loading="loading" class="space-y-4">
    <el-card v-if="data">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-2xl font-bold text-slate-900">
            {{ data.roleProfile.homeTitle }}
          </div>
          <div class="mt-1 text-sm text-slate-500">
            {{ data.roleProfile.description }}
          </div>
        </div>
        <el-tag type="info">{{ data.roleProfile.label }}</el-tag>
      </div>
    </el-card>

    <div v-if="data?.focusCards.length" class="grid gap-4 md:grid-cols-4">
      <el-card
        v-for="card in data.focusCards"
        :key="card.key"
        class="cursor-pointer"
        @click="navigate(card.targetPath)"
      >
        <div class="text-sm text-slate-500">{{ card.title }}</div>
        <div class="mt-3 text-2xl font-bold text-slate-900">
          {{ formatCardValue(card) }}
        </div>
      </el-card>
    </div>

    <el-card v-if="data?.todoItems.length">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">待处理事项</span>
          <span class="text-xs text-slate-500">按角色聚焦展示</span>
        </div>
      </template>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in data.todoItems"
          :key="item.key"
          class="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4"
          @click="navigate(item.targetPath)"
        >
          <div class="text-xs uppercase tracking-wide text-slate-400">
            {{ item.module }}
          </div>
          <div class="mt-2 text-sm font-medium text-slate-700">
            {{ item.label }}
          </div>
          <div class="mt-2 text-2xl font-semibold text-slate-900">
            {{ item.value }}
          </div>
        </div>
      </div>
    </el-card>

    <RoleDashboardSection
      v-for="section in data?.sections ?? []"
      :key="section.key"
      :section="section"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getNoticeApi,
  getRoleHomeApi,
  type RoleDashboardCard,
  type RoleDashboardData,
  type RoleDashboardSection,
  type RoleDashboardTodoItem
} from "@/api";
import {
  getNoticeLevelMeta,
  normalizeNoticeList,
  type ListItem
} from "@/layout/components/notice/data";
import { findRouteByPath } from "@/router/utils/finder";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useUserStoreHook } from "@/store/modules/user";
import { handleApiError } from "@/utils";
import {
  getDefaultHomeShortcuts,
  getRoleHomeShortcuts,
  type HomeShortcut
} from "./homeShortcuts";

defineOptions({
  name: "Welcome"
});

const DASHBOARD_PATH = "/analysis/dashboard";
const NOTICE_PATH = "/system/notice";
const NOTICE_LIMIT = 4;
const SECTION_RANKING_LIMIT = 3;

const router = useRouter();
const userStore = useUserStoreHook();
const companyStore = useCurrentCompanyStoreHook();
const permissionStore = usePermissionStoreHook();

const loading = ref(false);
const roleHome = ref<RoleDashboardData | null>(null);
const notices = ref<ListItem[]>([]);

const displayName = computed(
  () => userStore.nickname || userStore.username || "同事"
);
const currentCompanyName = computed(
  () => companyStore.companyName || "当前公司"
);
const currentStoreName = computed(() => companyStore.storeName || "全部门店");
const visibleNotices = computed(() => notices.value.slice(0, NOTICE_LIMIT));
const canViewNoticePage = computed(() => hasRouteAccess(NOTICE_PATH));
const canViewDashboard = computed(() => hasRouteAccess(DASHBOARD_PATH));

const shortcuts = computed<HomeShortcut[]>(() => {
  const primary = getRoleHomeShortcuts(roleHome.value?.roleProfile.key).filter(
    item => hasRouteAccess(item.path)
  );

  if (primary.length > 0) {
    return primary;
  }

  return getDefaultHomeShortcuts().filter(item => hasRouteAccess(item.path));
});

function hasRouteAccess(path: string) {
  if (!path) return false;
  if (findRouteByPath(path, permissionStore.wholeMenus)) return true;
  return router
    .getRoutes()
    .some(route => route.path === path && route.meta?.showLink !== false);
}

function formatCardValue(card: RoleDashboardCard) {
  if (card.key.includes("amount") || card.key.includes("value")) {
    return `¥${card.value}`;
  }
  return card.value;
}

function getTodoTagType(level: RoleDashboardTodoItem["level"]) {
  if (level === "danger") return "danger";
  if (level === "warning") return "warning";
  return "info";
}

function getSectionRanking(section: RoleDashboardSection) {
  return section.ranking.slice(0, SECTION_RANKING_LIMIT);
}

function getSectionMetricText(section: RoleDashboardSection, index: number) {
  const item = getSectionRanking(section)[index];
  if (!item) return "-";
  if (item.amount) return `¥${item.amount}`;
  if (typeof item.value === "number") return String(item.value);
  if (typeof item.count === "number") return String(item.count);
  return "-";
}

function navigateTo(path?: string) {
  if (!path) return;
  void router.push(path);
}

async function loadRoleHome() {
  const { code, data, msg } = await getRoleHomeApi();
  if (code !== 200 || !data) {
    throw new Error(msg || "首页角色数据加载失败");
  }
  roleHome.value = data;
}

async function loadNotices() {
  const { code, data, msg } = await getNoticeApi();
  if (code !== 200) {
    throw new Error(msg || "首页公告加载失败");
  }
  notices.value = normalizeNoticeList(data ?? []);
}

async function loadWorkbench() {
  loading.value = true;
  const [roleHomeResult, noticeResult] = await Promise.allSettled([
    loadRoleHome(),
    loadNotices()
  ]);

  if (roleHomeResult.status === "rejected") {
    handleApiError(roleHomeResult.reason, "加载首页工作台失败");
  }
  if (noticeResult.status === "rejected") {
    handleApiError(noticeResult.reason, "加载首页公告失败");
  }

  loading.value = false;
}

function resolveNoticeTone(level: number) {
  return getNoticeLevelMeta(level).status;
}

onMounted(() => {
  void loadWorkbench();
});
</script>

<template>
  <div v-loading="loading" class="welcome-page">
    <section class="hero-panel">
      <div class="hero-copy">
        <div class="hero-caption">工作台</div>
        <h1 class="hero-title">
          {{ roleHome?.roleProfile.homeTitle || "首页工作台" }}
        </h1>
        <p class="hero-description">
          {{
            roleHome?.roleProfile.description ||
            "在一个页面汇总经营指标、公告提醒和常用入口。"
          }}
        </p>

        <div class="hero-meta">
          <el-tag effect="dark" round type="primary">
            {{ roleHome?.roleProfile.label || "总览" }}
          </el-tag>
          <span>{{ displayName }}</span>
          <span>{{ currentCompanyName }}</span>
          <span>{{ currentStoreName }}</span>
        </div>
      </div>

      <div class="hero-actions">
        <el-button
          v-if="canViewDashboard"
          type="primary"
          size="large"
          @click="navigateTo(DASHBOARD_PATH)"
        >
          进入经营驾驶舱
        </el-button>
        <div class="hero-stat-grid">
          <div
            v-for="card in roleHome?.focusCards ?? []"
            :key="card.key"
            class="hero-stat-card"
            @click="navigateTo(card.targetPath)"
          >
            <span class="hero-stat-label">{{ card.title }}</span>
            <strong class="hero-stat-value">{{ formatCardValue(card) }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="workbench-grid">
      <el-card class="shortcut-panel" shadow="never">
        <template #header>
          <div class="panel-header">
            <div>
              <div class="panel-title">快捷入口</div>
              <div class="panel-subtitle">按角色推荐的高频操作</div>
            </div>
          </div>
        </template>

        <div v-if="shortcuts.length" class="shortcut-grid">
          <button
            v-for="item in shortcuts"
            :key="item.key"
            type="button"
            class="shortcut-card"
            @click="navigateTo(item.path)"
          >
            <span class="shortcut-icon">
              <IconifyIconOffline :icon="item.icon" />
            </span>
            <span class="shortcut-title">{{ item.title }}</span>
            <span class="shortcut-description">{{ item.description }}</span>
          </button>
        </div>
        <el-empty v-else description="当前角色暂无可用快捷入口" />
      </el-card>

      <div class="aside-stack">
        <el-card class="todo-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">待处理事项</div>
                <div class="panel-subtitle">来自角色首页的待办聚合</div>
              </div>
            </div>
          </template>

          <div v-if="roleHome?.todoItems.length" class="todo-list">
            <button
              v-for="item in roleHome?.todoItems ?? []"
              :key="item.key"
              type="button"
              class="todo-item"
              @click="navigateTo(item.targetPath)"
            >
              <div class="todo-item-top">
                <span class="todo-module">{{ item.module }}</span>
                <el-tag size="small" :type="getTodoTagType(item.level)">
                  {{ item.level }}
                </el-tag>
              </div>
              <div class="todo-item-main">
                <span class="todo-label">{{ item.label }}</span>
                <strong class="todo-value">{{ item.value }}</strong>
              </div>
            </button>
          </div>
          <el-empty v-else description="暂无待处理事项" />
        </el-card>

        <el-card class="notice-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">公告提醒</div>
                <div class="panel-subtitle">同步公司公告推送</div>
              </div>
              <el-button
                v-if="canViewNoticePage"
                link
                type="primary"
                @click="navigateTo(NOTICE_PATH)"
              >
                查看更多
              </el-button>
            </div>
          </template>

          <div v-if="visibleNotices.length" class="notice-list">
            <button
              v-for="notice in visibleNotices"
              :key="notice.uid"
              type="button"
              class="notice-row"
              @click="canViewNoticePage && navigateTo(NOTICE_PATH)"
            >
              <div class="notice-row-top">
                <div class="notice-title-row">
                  <span class="notice-title">{{ notice.title }}</span>
                  <el-tag size="small" :type="resolveNoticeTone(notice.level)">
                    {{ notice.levelLabel }}
                  </el-tag>
                </div>
                <span class="notice-datetime">{{ notice.datetime }}</span>
              </div>
              <p class="notice-description">{{ notice.description }}</p>
            </button>
          </div>
          <el-empty v-else description="暂无公告" />
        </el-card>
      </div>
    </section>

    <section v-if="roleHome?.sections.length" class="section-grid">
      <el-card
        v-for="section in roleHome?.sections ?? []"
        :key="section.key"
        class="section-card"
        shadow="never"
      >
        <template #header>
          <div class="panel-header">
            <div>
              <div class="panel-title">{{ section.title }}</div>
              <div class="panel-subtitle">保留首页摘要，详情进入分析页</div>
            </div>
            <el-button
              link
              type="primary"
              @click="navigateTo(section.targetPath)"
            >
              查看详情
            </el-button>
          </div>
        </template>

        <div class="section-summary-grid">
          <div
            v-for="card in section.summaryCards"
            :key="card.key"
            class="section-metric"
          >
            <span class="section-metric-label">{{ card.title }}</span>
            <strong class="section-metric-value">{{
              formatCardValue(card)
            }}</strong>
          </div>
        </div>

        <div v-if="section.alerts.length" class="section-alerts">
          <el-tag
            v-for="alert in section.alerts"
            :key="alert.key"
            size="small"
            :type="alert.level === 'danger' ? 'danger' : alert.level"
          >
            {{ alert.label }} {{ alert.value }}
          </el-tag>
        </div>

        <div v-if="getSectionRanking(section).length" class="section-ranking">
          <div
            v-for="(item, index) in getSectionRanking(section)"
            :key="item.id"
            class="section-ranking-item"
          >
            <div class="section-ranking-left">
              <span class="section-ranking-index">0{{ index + 1 }}</span>
              <span class="section-ranking-name">{{ item.name }}</span>
            </div>
            <strong class="section-ranking-value">
              {{ getSectionMetricText(section, index) }}
            </strong>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.welcome-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1480px;
  padding: 12px 8px 28px;
  margin: 0 auto;
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.95fr);
  gap: 20px;
  padding: 28px;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(circle at top left, rgb(34 197 94 / 18%), transparent 32%),
    radial-gradient(
      circle at right center,
      rgb(37 99 235 / 24%),
      transparent 28%
    ),
    linear-gradient(135deg, #0f172a 0%, #102a43 48%, #13315c 100%);
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 28px;
}

.hero-copy,
.hero-actions {
  position: relative;
  z-index: 1;
}

.hero-caption {
  font-size: 13px;
  font-weight: 600;
  color: rgb(226 232 240 / 78%);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.hero-title {
  margin: 10px 0 0;
  font-size: 34px;
  line-height: 1.12;
}

.hero-description {
  max-width: 680px;
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.8;
  color: rgb(226 232 240 / 86%);
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 18px;
  font-size: 13px;
  color: rgb(226 232 240 / 88%);
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
}

.hero-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.hero-stat-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 108px;
  padding: 18px;
  cursor: pointer;
  background: rgb(255 255 255 / 8%);
  border: 1px solid rgb(226 232 240 / 12%);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.hero-stat-card:hover {
  background: rgb(255 255 255 / 12%);
  border-color: rgb(191 219 254 / 44%);
  transform: translateY(-2px);
}

.hero-stat-label {
  font-size: 12px;
  color: rgb(226 232 240 / 82%);
}

.hero-stat-value {
  font-size: 26px;
  line-height: 1.1;
}

.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.86fr);
  gap: 20px;
  align-items: start;
}

.aside-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.panel-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.shortcut-card,
.todo-item,
.notice-row {
  width: 100%;
  padding: 0;
  text-align: left;
  background: transparent;
  border: 0;
}

.shortcut-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 156px;
  padding: 18px;
  cursor: pointer;
  background:
    linear-gradient(180deg, rgb(241 245 249 / 92%), rgb(255 255 255 / 98%)),
    linear-gradient(145deg, rgb(59 130 246 / 6%), rgb(34 197 94 / 8%));
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.shortcut-card:hover,
.todo-item:hover,
.notice-row:hover {
  border-color: rgb(59 130 246 / 28%);
  box-shadow: 0 20px 38px -28px rgb(15 23 42 / 38%);
  transform: translateY(-2px);
}

.shortcut-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 20px;
  color: #1d4ed8;
  background: #dbeafe;
  border-radius: 14px;
}

.shortcut-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.shortcut-description {
  font-size: 13px;
  line-height: 1.65;
  color: #475569;
}

.todo-list,
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item,
.notice-row {
  padding: 16px;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.todo-item-top,
.todo-item-main,
.notice-row-top,
.notice-title-row,
.section-ranking-item,
.section-ranking-left {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.todo-module {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.todo-item-main {
  align-items: flex-end;
  margin-top: 14px;
}

.todo-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.todo-value {
  font-size: 24px;
  line-height: 1;
  color: #0f172a;
}

.notice-title-row {
  justify-content: flex-start;
}

.notice-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.notice-datetime {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.notice-description {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.75;
  color: #475569;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.section-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.section-metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 18px;
}

.section-metric-label {
  font-size: 12px;
  color: #64748b;
}

.section-metric-value {
  font-size: 20px;
  color: #0f172a;
}

.section-alerts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.section-ranking {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}

.section-ranking-item {
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.section-ranking-item:last-child {
  border-bottom: 0;
}

.section-ranking-index {
  min-width: 26px;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.section-ranking-name {
  font-size: 14px;
  color: #0f172a;
}

.section-ranking-value {
  font-size: 14px;
  color: #1d4ed8;
}

@media (width <= 1200px) {
  .hero-panel,
  .workbench-grid,
  .section-grid {
    grid-template-columns: 1fr;
  }
}

@media (width <= 900px) {
  .shortcut-grid,
  .section-summary-grid,
  .hero-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 640px) {
  .welcome-page {
    padding-inline: 0;
  }

  .hero-panel {
    padding: 22px;
    border-radius: 22px;
  }

  .hero-title {
    font-size: 28px;
  }

  .shortcut-grid,
  .section-summary-grid,
  .hero-stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>

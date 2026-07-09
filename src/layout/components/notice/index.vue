<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { createNoticeTabs, type TabItem } from "./data";
import NoticeList from "./noticeList.vue";
import Bell from "~icons/ep/bell";
import { getNoticeApi } from "@/api";
import { message } from "@/utils/message";

const notices = ref<TabItem[]>([]);
const activeKey = ref("notice");

const noticesNum = computed(() =>
  notices.value.reduce((count, item) => count + item.list.length, 0)
);

const getNotice = async () => {
  try {
    const { data, code, msg } = await getNoticeApi();
    if (code === 200) {
      notices.value = createNoticeTabs(data ?? []);
      return;
    }
    message(msg, { type: "error" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "公告加载失败";
    message(detail, { type: "error" });
  }
};

onMounted(async () => {
  await getNotice();
});
</script>

<template>
  <el-dropdown trigger="click" placement="bottom-end">
    <span class="dropdown-badge navbar-bg-hover select-none">
      <el-badge :value="noticesNum" :hidden="noticesNum === 0" :max="99">
        <span class="header-notice-icon">
          <IconifyIconOffline :icon="Bell" />
        </span>
      </el-badge>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-tabs
          v-model="activeKey"
          :stretch="true"
          class="dropdown-tabs"
          :style="{ width: notices.length === 0 ? '200px' : '330px' }"
        >
          <el-empty
            v-if="notices.length === 0"
            description="暂无消息"
            :image-size="60"
          />
          <span v-else>
            <template v-for="item in notices" :key="item.key">
              <el-tab-pane
                :label="`${item.name}(${item.list.length})`"
                :name="`${item.key}`"
              >
                <el-scrollbar max-height="330px">
                  <div class="noticeList-container">
                    <NoticeList :list="item.list" />
                  </div>
                </el-scrollbar>
              </el-tab-pane>
            </template>
          </span>
        </el-tabs>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.dropdown-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 48px;
  margin-right: 10px;
  cursor: pointer;

  .header-notice-icon {
    font-size: 18px;
  }
}

.dropdown-tabs {
  .noticeList-container {
    padding: 15px 24px 0;
  }

  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap)::after {
    height: 1px;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 0 36px;
  }
}
</style>

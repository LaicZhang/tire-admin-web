<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getUpdateHistoryApi } from "@/api/auth";
import { message } from "@/utils/message";

defineOptions({
  name: "UpdateHistory"
});

const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const dataList = ref<
  {
    version: string;
    title: string;
    content: string;
    releaseDate: string;
    type: "feature" | "fix" | "improvement";
  }[]
>([]);

const typeMap = {
  feature: { label: "新功能", type: "success" as const },
  fix: { label: "修复", type: "danger" as const },
  improvement: { label: "优化", type: "primary" as const }
};

async function loadData() {
  loading.value = true;
  try {
    const { data, code, msg } = await getUpdateHistoryApi(currentPage.value);
    if (code === 200) {
      const result = data as { list?: typeof dataList.value; total?: number };
      dataList.value = result?.list || [];
      total.value = result?.total || 0;
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载更新历史失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadData();
}

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <el-card>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-lg font-medium">更新历史</span>
        <el-button type="primary" size="small" @click="loadData"
          >刷新</el-button
        >
      </div>
    </template>

    <el-timeline v-loading="loading">
      <el-timeline-item
        v-for="item in dataList"
        :key="item.version"
        :timestamp="formatDate(item.releaseDate)"
        placement="top"
      >
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center gap-2">
              <el-tag size="small">{{ item.version }}</el-tag>
              <el-tag
                v-if="item.type && typeMap[item.type]"
                :type="typeMap[item.type].type"
                size="small"
              >
                {{ typeMap[item.type].label }}
              </el-tag>
              <span class="font-medium">{{ item.title }}</span>
            </div>
          </template>
          <div class="text-sm text-gray-600 whitespace-pre-line">
            {{ item.content }}
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <el-empty
      v-if="!loading && dataList.length === 0"
      description="暂无更新记录"
    />

    <div v-if="total > pageSize" class="flex justify-center mt-4">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        background
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </el-card>
</template>

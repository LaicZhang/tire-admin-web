<template>
  <div class="skeleton-page">
    <!-- 顶部搜索区域骨架 -->
    <el-card class="skeleton-search" shadow="never">
      <div class="skeleton-search-row">
        <el-skeleton-item variant="text" style="width: 60px" />
        <el-skeleton-item variant="rect" style="width: 180px; height: 32px" />
        <el-skeleton-item variant="text" style="width: 60px" />
        <el-skeleton-item variant="rect" style="width: 180px; height: 32px" />
        <el-skeleton-item variant="button" style="width: 80px; height: 32px" />
        <el-skeleton-item variant="button" style="width: 80px; height: 32px" />
      </div>
    </el-card>
    <!-- 表格区域骨架 -->
    <el-card class="skeleton-table" shadow="never">
      <div class="skeleton-table-header">
        <el-skeleton-item variant="text" style="width: 100px" />
        <div class="skeleton-table-actions">
          <el-skeleton-item
            variant="button"
            style="width: 80px; height: 32px"
          />
          <el-skeleton-item
            variant="button"
            style="width: 80px; height: 32px"
          />
        </div>
      </div>
      <el-skeleton :rows="8" animated />
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "SkeletonPage"
});
</script>

<style scoped>
.skeleton-page {
  padding: 8px;
}

.skeleton-search {
  margin-bottom: 16px;
}

.skeleton-search-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.skeleton-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.skeleton-table-actions {
  display: flex;
  gap: 8px;
}
</style>

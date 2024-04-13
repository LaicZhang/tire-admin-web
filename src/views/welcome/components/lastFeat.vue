<script setup lang="ts">
import { ref, markRaw, onMounted } from "vue";
import { useRenderFlicker } from "@/components/ReFlicker";
import { randomGradient } from "@pureadmin/utils";
import ReCol from "@/components/ReCol";
import { getSystemUpdateLogApi } from "@/api";
import { formatDate } from "@/utils/time";
import { message } from "@/utils/message";

defineOptions({
  name: "lastFeat"
});
const latestNewsData = ref();
const index = ref(1);
const getSystemUpdateLog = () => {
  getSystemUpdateLogApi(index.value).then(res => {
    if (res.code === 200) {
      latestNewsData.value = res.data;
    } else {
      message(res.message, { type: "error" });
    }
  });
};

onMounted(() => {
  getSystemUpdateLog();
});
</script>

<template>
  <re-col
    v-motion
    class="mb-[18px]"
    :value="6"
    :xs="24"
    :initial="{
      opacity: 0,
      y: 100
    }"
    :enter="{
      opacity: 1,
      y: 0,
      transition: {
        delay: 640
      }
    }"
  >
    <el-card shadow="never">
      <div class="flex justify-between">
        <span class="text-md font-medium">最新动态</span>
      </div>
      <el-scrollbar max-height="504" class="mt-3">
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in latestNewsData"
            :key="index"
            center
            placement="top"
            :icon="
              markRaw(
                useRenderFlicker({
                  background: randomGradient({
                    randomizeHue: true
                  })
                })
              )
            "
            :timestamp="formatDate(item.createAt)"
          >
            <p class="text-text_color_regular text-sm">
              {{ item.title }}
            </p>
          </el-timeline-item>
        </el-timeline>
      </el-scrollbar>
    </el-card>
  </re-col>
</template>

<style lang="scss" scoped>
:deep(.el-card) {
  --el-card-border-color: none;

  /* 解决概率进度条宽度 */
  .el-progress--line {
    width: 85%;
  }

  /* 解决概率进度条字体大小 */
  .el-progress-bar__innerText {
    font-size: 15px;
  }

  /* 隐藏 el-scrollbar 滚动条 */
  .el-scrollbar__bar {
    display: none;
  }

  /* el-timeline 每一项上下、左右边距 */
  .el-timeline-item {
    margin: 0 6px;
  }
}

.main-content {
  margin: 20px 20px 0 !important;
}
</style>

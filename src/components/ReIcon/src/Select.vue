<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { IconifyIconOffline } from "../index";

defineOptions({
  name: "IconSelect"
});

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const inputValue = ref(props.modelValue || "");
const popoverVisible = ref(false);
const searchQuery = ref("");

// 常用 Element Plus 图标
const epIcons = [
  "ep:home-filled",
  "ep:user",
  "ep:user-filled",
  "ep:setting",
  "ep:tools",
  "ep:menu",
  "ep:grid",
  "ep:list",
  "ep:document",
  "ep:folder",
  "ep:folder-opened",
  "ep:files",
  "ep:edit",
  "ep:delete",
  "ep:plus",
  "ep:minus",
  "ep:search",
  "ep:refresh",
  "ep:upload",
  "ep:download",
  "ep:picture",
  "ep:link",
  "ep:notification",
  "ep:message",
  "ep:bell",
  "ep:lock",
  "ep:unlock",
  "ep:key",
  "ep:star",
  "ep:star-filled",
  "ep:clock",
  "ep:calendar",
  "ep:view",
  "ep:hide",
  "ep:position",
  "ep:location",
  "ep:phone",
  "ep:chat-dot-round",
  "ep:video-camera",
  "ep:monitor",
  "ep:printer",
  "ep:help",
  "ep:info-filled",
  "ep:warning",
  "ep:success-filled",
  "ep:circle-check",
  "ep:circle-close",
  "ep:close",
  "ep:check"
];

// Remix Icon 常用图标
const riIcons = [
  "ri:dashboard-line",
  "ri:home-line",
  "ri:user-line",
  "ri:settings-line",
  "ri:file-list-line",
  "ri:folder-line",
  "ri:search-line",
  "ri:add-line",
  "ri:delete-bin-line",
  "ri:edit-line",
  "ri:save-line",
  "ri:refresh-line",
  "ri:upload-line",
  "ri:download-line",
  "ri:image-line",
  "ri:link",
  "ri:notification-line",
  "ri:message-line",
  "ri:mail-line",
  "ri:lock-line",
  "ri:key-line",
  "ri:star-line",
  "ri:time-line",
  "ri:calendar-line",
  "ri:eye-line",
  "ri:eye-off-line",
  "ri:map-pin-line",
  "ri:phone-line",
  "ri:chat-1-line",
  "ri:video-line",
  "ri:computer-line",
  "ri:question-line",
  "ri:information-line",
  "ri:error-warning-line",
  "ri:checkbox-circle-line",
  "ri:close-circle-line",
  "ri:close-line",
  "ri:check-line"
];

const allIcons = computed(() => [...epIcons, ...riIcons]);

const filteredIcons = computed(() => {
  if (!searchQuery.value) return allIcons.value;
  const query = searchQuery.value.toLowerCase();
  return allIcons.value.filter(icon => icon.toLowerCase().includes(query));
});

const selectIcon = (icon: string) => {
  inputValue.value = icon;
  emit("update:modelValue", icon);
  popoverVisible.value = false;
};

const clearIcon = () => {
  inputValue.value = "";
  emit("update:modelValue", "");
};

watch(
  () => props.modelValue,
  val => {
    inputValue.value = val || "";
  }
);
</script>

<template>
  <el-popover
    v-model:visible="popoverVisible"
    placement="bottom-start"
    :width="360"
    trigger="click"
  >
    <template #reference>
      <el-input
        v-model="inputValue"
        placeholder="点击选择图标"
        readonly
        clearable
        @clear="clearIcon"
      >
        <template #prefix>
          <IconifyIconOffline
            v-if="inputValue"
            :icon="inputValue"
            class="text-lg"
          />
          <el-icon v-else><icon-ep-search /></el-icon>
        </template>
      </el-input>
    </template>

    <div class="icon-select-popover">
      <el-input
        v-model="searchQuery"
        placeholder="搜索图标"
        clearable
        class="mb-3"
      >
        <template #prefix>
          <el-icon><icon-ep-search /></el-icon>
        </template>
      </el-input>

      <el-scrollbar height="280px">
        <div class="icon-grid">
          <div
            v-for="icon in filteredIcons"
            :key="icon"
            class="icon-item"
            :class="{ active: inputValue === icon }"
            :title="icon"
            @click="selectIcon(icon)"
          >
            <IconifyIconOffline :icon="icon" class="text-xl" />
          </div>
        </div>
        <el-empty
          v-if="filteredIcons.length === 0"
          description="未找到匹配的图标"
          :image-size="60"
        />
      </el-scrollbar>
    </div>
  </el-popover>
</template>

<style scoped>
.icon-select-popover {
  padding: 4px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  transition: all 0.2s;
}

.icon-item:hover {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.icon-item.active {
  color: #fff;
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.mb-3 {
  margin-bottom: 12px;
}

.text-lg {
  font-size: 1.125rem;
}

.text-xl {
  font-size: 1.25rem;
}
</style>

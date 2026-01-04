<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "~icons/ep/delete";
import type { DeleteButtonProps, DeleteButtonEmits } from "./types";

defineOptions({
  name: "DeleteButton"
});

const props = withDefaults(defineProps<DeleteButtonProps>(), {
  title: "确认删除此数据吗？",
  text: "删除",
  disabled: false,
  showIcon: true,
  size: "default",
  confirmButtonText: "确定",
  cancelButtonText: "取消"
});

const emit = defineEmits<DeleteButtonEmits>();

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<template>
  <el-popconfirm
    :title="title"
    :confirm-button-text="confirmButtonText"
    :cancel-button-text="cancelButtonText"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template #reference>
      <el-button
        link
        type="danger"
        :size="size"
        :icon="showIcon ? useRenderIcon(Delete) : undefined"
        :disabled="disabled"
      >
        {{ text }}
      </el-button>
    </template>
  </el-popconfirm>
</template>

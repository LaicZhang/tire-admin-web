<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Download from "~icons/ep/download";
import type { DataAuthUser, AuthItem } from "../types";

defineProps<{
  visible: boolean;
  currentUser: DataAuthUser | null;
  customerList: AuthItem[];
}>();

defineEmits<{
  "update:visible": [value: boolean];
  export: [];
}>();
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="`授权查看 - ${currentUser?.username}`"
    width="600px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="flex justify-end mb-4">
      <el-button :icon="useRenderIcon(Download)" @click="$emit('export')">
        导出
      </el-button>
    </div>
    <pure-table
      border
      :data="customerList"
      :columns="[
        { label: '编码', prop: 'code', minWidth: 100 },
        { label: '名称', prop: 'name', minWidth: 150 },
        { label: '授权时间', prop: 'authTime', minWidth: 160 }
      ]"
      max-height="400"
    />
    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

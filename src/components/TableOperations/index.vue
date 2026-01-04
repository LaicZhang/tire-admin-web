<script setup lang="ts">
import { computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Eye from "~icons/ep/view";
import EditPen from "~icons/ep/edit-pen";
import DeleteButton from "@/components/DeleteButton/index.vue";
import type { TableOperationsProps, TableOperationsEmits } from "./types";

defineOptions({
  name: "TableOperations"
});

const props = withDefaults(defineProps<TableOperationsProps>(), {
  showView: true,
  showEdit: true,
  showAudit: false,
  showDelete: true,
  deleteTitle: "确认删除此数据吗？",
  size: "default",
  lockedField: "isLocked",
  approvedField: "isApproved"
});

const emit = defineEmits<TableOperationsEmits>();

const isLocked = computed(() => Boolean(props.row[props.lockedField]));
const isApproved = computed(() => Boolean(props.row[props.approvedField]));

const handleView = () => emit("view", props.row);
const handleEdit = () => emit("edit", props.row);
const handleAudit = () => emit("audit", props.row);
const handleDelete = () => emit("delete", props.row);
</script>

<template>
  <div class="table-operations">
    <el-button
      v-if="showView"
      class="reset-margin"
      link
      type="primary"
      :size="size"
      :icon="useRenderIcon(Eye)"
      @click="handleView"
    >
      查看
    </el-button>
    <el-button
      v-if="showEdit && !isLocked"
      class="reset-margin"
      link
      type="primary"
      :size="size"
      :icon="useRenderIcon(EditPen)"
      @click="handleEdit"
    >
      修改
    </el-button>
    <el-button
      v-if="showAudit && !isApproved"
      class="reset-margin"
      link
      type="primary"
      :size="size"
      @click="handleAudit"
    >
      审核
    </el-button>
    <!-- 自定义操作插槽 -->
    <slot />
    <DeleteButton
      v-if="showDelete && !isLocked"
      :title="deleteTitle"
      :size="size"
      :show-icon="false"
      @confirm="handleDelete"
    />
  </div>
</template>

<style lang="scss" scoped>
.table-operations {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
</style>

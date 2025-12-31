<script setup lang="ts">
import { computed } from "vue";
import type {
  SelectType,
  SelectRow
} from "../composables/useAuthObjectSelector";

const props = defineProps<{
  visible: boolean;
  selectType: SelectType;
  selectKeyword: string;
  selectLoading: boolean;
  selectList: SelectRow[];
  selectSelectedRows: SelectRow[];
  selectPagination: {
    total: number;
    pageSize: number;
    currentPage: number;
    background: boolean;
  };
  selectColumns: TableColumnList;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:selectKeyword": [value: string];
  "selection-change": [rows: SelectRow[]];
  "page-change": [page: number];
  search: [];
  reset: [];
  confirm: [];
}>();

const selectDialogTitle = computed(() => {
  if (props.selectType === "customer") return "选择客户";
  if (props.selectType === "supplier") return "选择供应商";
  return "选择仓库";
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="selectDialogTitle"
    width="800px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="flex justify-between mb-4">
      <el-input
        :model-value="selectKeyword"
        placeholder="请输入关键字"
        clearable
        class="w-72"
        @update:model-value="emit('update:selectKeyword', $event)"
        @keyup.enter="emit('search')"
      />
      <div class="space-x-2">
        <el-button @click="emit('reset')">重置</el-button>
        <el-button type="primary" @click="emit('search')">查询</el-button>
      </div>
    </div>
    <pure-table
      border
      row-key="uid"
      alignWhole="center"
      showOverflowTooltip
      :loading="selectLoading"
      :data="selectList"
      :columns="selectColumns"
      @selection-change="emit('selection-change', $event)"
    />
    <div class="flex justify-end mt-4">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="selectPagination.total"
        :page-size="selectPagination.pageSize"
        :current-page="selectPagination.currentPage"
        @current-change="emit('page-change', $event)"
      />
    </div>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="emit('confirm')">确定</el-button>
    </template>
  </el-dialog>
</template>

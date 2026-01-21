<script setup lang="tsx">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import View from "~icons/ep/view";
import { PureTableBar } from "@/components/RePureTableBar";
import type { DataAuthUser } from "../types";

defineProps<{
  loading: boolean;
  userList: DataAuthUser[];
}>();

const emit = defineEmits<{
  edit: [row: DataAuthUser];
  view: [row: DataAuthUser];
  refresh: [];
}>();

const columns: TableColumnList = [
  {
    label: "用户名",
    prop: "username",
    minWidth: 120
  },
  {
    label: "手机号",
    prop: "phone",
    minWidth: 120
  },
  {
    label: "角色",
    prop: "roleName",
    minWidth: 100
  },
  {
    label: "客户授权",
    prop: "customerAuth",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <el-tag
        type={row.customerAuth === "all" ? "success" : "warning"}
        effect="plain"
      >
        {row.customerAuth === "all" ? "全部" : "部分"}
      </el-tag>
    )
  },
  {
    label: "供应商授权",
    prop: "supplierAuth",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <el-tag
        type={row.supplierAuth === "all" ? "success" : "warning"}
        effect="plain"
      >
        {row.supplierAuth === "all" ? "全部" : "部分"}
      </el-tag>
    )
  },
  {
    label: "仓库授权",
    prop: "warehouseAuth",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <el-tag
        type={row.warehouseAuth === "all" ? "success" : "warning"}
        effect="plain"
      >
        {row.warehouseAuth === "all" ? "全部" : "部分"}
      </el-tag>
    )
  },
  {
    label: "操作",
    width: 200,
    fixed: "right",
    slot: "operation"
  }
];
</script>

<template>
  <PureTableBar title="数据授权" @refresh="emit('refresh')">
    <template v-slot="{ size }">
      <pure-table
        border
        adaptive
        row-key="uid"
        alignWhole="center"
        showOverflowTooltip
        :loading="loading"
        :data="userList"
        :columns="columns"
      >
        <template #operation="{ row }">
          <el-button
            class="reset-margin"
            link
            type="primary"
            :size="size"
            :icon="useRenderIcon(EditPen)"
            @click="emit('edit', row)"
          >
            编辑授权
          </el-button>
          <el-button
            class="reset-margin"
            link
            type="primary"
            :size="size"
            :icon="useRenderIcon(View)"
            @click="emit('view', row)"
          >
            授权查看
          </el-button>
        </template>
      </pure-table>
    </template>
  </PureTableBar>
</template>

<script setup lang="tsx">
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import Delete from "~icons/ep/delete";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { PureTableBar } from "@/components/RePureTableBar";
import { message } from "@/utils";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import {
  getRecycleListApi,
  restoreRecycleItemApi,
  permanentDeleteApi,
  batchRestoreApi,
  batchPermanentDeleteApi
} from "@/api/setting";
import type { RecycleItem } from "./types";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

defineOptions({
  name: "Recycle"
});

const selectedRows = ref<RecycleItem[]>([]);
const { confirm } = useConfirmDialog();

const state = ref({
  type: "",
  keyword: ""
});

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  RecycleItem,
  CommonResult<{ list: RecycleItem[]; count: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getRecycleListApi(page, state.value) as Promise<
      CommonResult<{ list: RecycleItem[]; count: number }>
    >,
  pagination: {
    pageSize: DEFAULT_PAGE_SIZE,
    currentPage: 1,
    pageSizes: [10, 20, 50, 100],
    background: true,
    layout: "total, sizes, prev, pager, next, jumper"
  },
  transform: res => {
    if (res.code !== 200) {
      message("加载回收站列表失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.count ?? 0
    };
  },
  immediate: true
});

const formColumns: PlusColumn[] = [
  {
    label: "类型",
    prop: "type",
    valueType: "select",
    options: [
      { label: "账套", value: "account" },
      { label: "商品", value: "product" },
      { label: "客户", value: "customer" },
      { label: "供应商", value: "supplier" },
      { label: "单据", value: "document" }
    ]
  },
  {
    label: "关键词",
    prop: "keyword",
    valueType: "copy"
  }
];

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const handleReset = () => {
  state.value = { type: "", keyword: "" };
  handleSearch();
};

const handleSelectionChange = (rows: RecycleItem[]) => {
  selectedRows.value = rows;
};

const restoreItem = async (row: RecycleItem) => {
  const ok = await confirm(`确定要还原 "${row.name}" 吗？`, "还原确认", {
    confirmButtonText: "确定还原",
    cancelButtonText: "取消",
    type: "info"
  });
  if (!ok) return;

  try {
    const { code } = await restoreRecycleItemApi(row.uid);
    if (code === 200) {
      message("还原成功", { type: "success" });
      fetchData();
    } else {
      message("还原失败", { type: "error" });
    }
  } catch {
    message("还原失败", { type: "error" });
  }
};

const deleteItem = async (row: RecycleItem) => {
  const ok = await confirm(
    `确定要彻底删除 "${row.name}" 吗？删除后将无法恢复！`,
    "彻底删除确认",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    }
  );
  if (!ok) return;

  try {
    const { code } = await permanentDeleteApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      fetchData();
    } else {
      message("删除失败", { type: "error" });
    }
  } catch {
    message("删除失败", { type: "error" });
  }
};

const batchRestore = async () => {
  if (selectedRows.value.length === 0) {
    message("请先选择要还原的项目", { type: "warning" });
    return;
  }
  const ok = await confirm(
    `确定要批量还原选中的 ${selectedRows.value.length} 个项目吗？`,
    "批量还原确认",
    {
      confirmButtonText: "确定还原",
      cancelButtonText: "取消",
      type: "info"
    }
  );
  if (!ok) return;

  try {
    const uids = selectedRows.value.map(r => r.uid);
    const { code } = await batchRestoreApi(uids);
    if (code === 200) {
      message("批量还原成功", { type: "success" });
      fetchData();
    } else {
      message("批量还原失败", { type: "error" });
    }
  } catch {
    message("批量还原失败", { type: "error" });
  }
};

const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    message("请先选择要删除的项目", { type: "warning" });
    return;
  }
  const ok = await confirm(
    `确定要彻底删除选中的 ${selectedRows.value.length} 个项目吗？删除后将无法恢复！`,
    "批量删除确认",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    }
  );
  if (!ok) return;

  try {
    const uids = selectedRows.value.map(r => r.uid);
    const { code } = await batchPermanentDeleteApi(uids);
    if (code === 200) {
      message("批量删除成功", { type: "success" });
      fetchData();
    } else {
      message("批量删除失败", { type: "error" });
    }
  } catch {
    message("批量删除失败", { type: "error" });
  }
};
</script>

<template>
  <div class="main">
    <PlusSearch
      v-model="state"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="formColumns"
      :show-number="2"
      label-width="60"
      label-position="right"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="bg-white p-4 rounded-md">
      <el-alert
        title="已删除的数据会在回收站保存90日，超过时间会自动清除。"
        type="info"
        :closable="false"
        class="mb-4"
      />

      <PureTableBar title="回收站" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(Refresh)"
            :disabled="selectedRows.length === 0"
            @click="batchRestore"
          >
            批量还原
          </el-button>
          <el-button
            type="danger"
            :icon="useRenderIcon(Delete)"
            :disabled="selectedRows.length === 0"
            @click="batchDelete"
          >
            批量删除
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            border
            adaptive
            row-key="uid"
            alignWhole="center"
            showOverflowTooltip
            :loading="loading"
            :data="dataList"
            :columns="columns"
            :pagination="pagination"
            @selection-change="handleSelectionChange"
            @page-size-change="onSizeChange"
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(Refresh)"
                @click="restoreItem(row)"
              >
                还原
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="danger"
                :size="size"
                :icon="useRenderIcon(Delete)"
                @click="deleteItem(row)"
              >
                彻底删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}
</style>

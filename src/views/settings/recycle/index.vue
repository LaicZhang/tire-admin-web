<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import Delete from "~icons/ep/delete";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { PureTableBar } from "@/components/RePureTableBar";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import {
  getRecycleListApi,
  restoreRecycleItemApi,
  permanentDeleteApi,
  batchRestoreApi,
  batchPermanentDeleteApi
} from "@/api/setting";
import type { RecycleItem } from "./types";

defineOptions({
  name: "Recycle"
});

const loading = ref(false);
const dataList = ref<RecycleItem[]>([]);
const selectedRows = ref<RecycleItem[]>([]);

const state = ref({
  type: "",
  keyword: ""
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

const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "名称",
    prop: "name",
    minWidth: 200
  },
  {
    label: "类型",
    prop: "typeName",
    minWidth: 100
  },
  {
    label: "删除时间",
    prop: "deleteTime",
    minWidth: 160
  },
  {
    label: "删除人",
    prop: "deleteByName",
    minWidth: 100
  },
  {
    label: "剩余天数",
    prop: "daysLeft",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <el-tag
        type={
          row.daysLeft <= 7 ? "danger" : row.daysLeft <= 30 ? "warning" : "info"
        }
        effect="plain"
      >
        {row.daysLeft} 天
      </el-tag>
    )
  },
  {
    label: "操作",
    width: 180,
    fixed: "right",
    slot: "operation"
  }
];

const pagination = reactive<PaginationProps>({
  pageSize: 20,
  currentPage: 1,
  pageSizes: [10, 20, 50, 100],
  total: 0,
  align: "right",
  background: true,
  layout: "total, sizes, prev, pager, next, jumper"
});

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data } = await getRecycleListApi(
      pagination.currentPage,
      state.value
    );
    if (code === 200 && data) {
      const result = data as { list: RecycleItem[]; count: number };
      dataList.value = result.list;
      pagination.total = result.count;
    }
  } catch {
    message("加载回收站列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.currentPage = 1;
  loadData();
};

const handleReset = () => {
  state.value = { type: "", keyword: "" };
  handleSearch();
};

const handleSelectionChange = (rows: RecycleItem[]) => {
  selectedRows.value = rows;
};

const onSizeChange = (val: number) => {
  pagination.pageSize = val;
  loadData();
};

const onCurrentChange = (val: number) => {
  pagination.currentPage = val;
  loadData();
};

const restoreItem = async (row: RecycleItem) => {
  try {
    await ElMessageBox.confirm(`确定要还原 "${row.name}" 吗？`, "还原确认", {
      confirmButtonText: "确定还原",
      cancelButtonText: "取消",
      type: "info"
    });
    const { code } = await restoreRecycleItemApi(row.uid);
    if (code === 200) {
      message("还原成功", { type: "success" });
      loadData();
    } else {
      message("还原失败", { type: "error" });
    }
  } catch {
    // cancelled or error
  }
};

const deleteItem = async (row: RecycleItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要彻底删除 "${row.name}" 吗？删除后将无法恢复！`,
      "彻底删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const { code } = await permanentDeleteApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message("删除失败", { type: "error" });
    }
  } catch {
    // cancelled or error
  }
};

const batchRestore = async () => {
  if (selectedRows.value.length === 0) {
    message("请先选择要还原的项目", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量还原选中的 ${selectedRows.value.length} 个项目吗？`,
      "批量还原确认",
      {
        confirmButtonText: "确定还原",
        cancelButtonText: "取消",
        type: "info"
      }
    );
    const uids = selectedRows.value.map(r => r.uid);
    const { code } = await batchRestoreApi(uids);
    if (code === 200) {
      message("批量还原成功", { type: "success" });
      loadData();
    } else {
      message("批量还原失败", { type: "error" });
    }
  } catch {
    // cancelled or error
  }
};

const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    message("请先选择要删除的项目", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要彻底删除选中的 ${selectedRows.value.length} 个项目吗？删除后将无法恢复！`,
      "批量删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const uids = selectedRows.value.map(r => r.uid);
    const { code } = await batchPermanentDeleteApi(uids);
    if (code === 200) {
      message("批量删除成功", { type: "success" });
      loadData();
    } else {
      message("批量删除失败", { type: "error" });
    }
  } catch {
    // cancelled or error
  }
};

onMounted(() => {
  loadData();
});
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

      <PureTableBar title="回收站" @refresh="loadData">
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
.main {
  margin: 20px;
}
</style>

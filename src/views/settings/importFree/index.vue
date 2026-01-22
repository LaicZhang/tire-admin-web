<script setup lang="tsx">
import { onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Upload from "~icons/ep/upload";
import Check from "~icons/ep/check";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { PureTableBar } from "@/components/RePureTableBar";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import {
  getFreeAccountsApi,
  importFreeAccountApi,
  batchImportFreeAccountsApi,
  verifyFreeAccountAuthApi
} from "@/api/setting";
import type { FreeAccountItem } from "./types";

defineOptions({
  name: "ImportFree"
});

const loading = ref(false);
const dataList = ref<FreeAccountItem[]>([]);
const selectedRows = ref<FreeAccountItem[]>([]);

const state = ref({
  accountName: "",
  companyName: ""
});

const formColumns: PlusColumn[] = [
  {
    label: "账套名称",
    prop: "accountName",
    valueType: "copy"
  },
  {
    label: "公司名称",
    prop: "companyName",
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
    label: "账套名称",
    prop: "accountName",
    minWidth: 150
  },
  {
    label: "公司名称",
    prop: "companyName",
    minWidth: 150
  },
  {
    label: "所有者",
    prop: "ownerName",
    minWidth: 100
  },
  {
    label: "手机号",
    prop: "ownerPhone",
    minWidth: 120
  },
  {
    label: "用户数",
    prop: "userCount",
    minWidth: 80,
    align: "center"
  },
  {
    label: "权限角色",
    prop: "role",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <el-tag
        type={
          row.role === "admin"
            ? "danger"
            : row.role === "manager"
              ? "warning"
              : "info"
        }
        effect="plain"
      >
        {row.role === "admin"
          ? "超级管理员"
          : row.role === "manager"
            ? "管理员"
            : "普通用户"}
      </el-tag>
    )
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    width: 200,
    fixed: "right",
    slot: "operation"
  }
];

const handleSearch = async () => {
  loading.value = true;
  try {
    const { code, data } = await getFreeAccountsApi(state.value);
    if (code === 200 && data) {
      dataList.value = data as FreeAccountItem[];
    }
  } catch {
    message("加载账套列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  state.value = { accountName: "", companyName: "" };
  handleSearch();
};

const handleSelectionChange = (rows: FreeAccountItem[]) => {
  selectedRows.value = rows;
};

const handleBatchImport = async () => {
  if (selectedRows.value.length === 0) {
    message("请先选择要导入的账套", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量导入选中的 ${selectedRows.value.length} 个账套吗？`,
      "批量导入确认",
      {
        confirmButtonText: "确定导入",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const uids = selectedRows.value.map(r => r.uid);
    const { code } = await batchImportFreeAccountsApi(uids);
    if (code === 200) {
      message("批量导入成功", { type: "success" });
      handleSearch();
    } else {
      message("批量导入失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("批量导入失败", { type: "error" });
    }
  }
};

const handleImport = async (row: FreeAccountItem) => {
  if (row.role !== "admin" && row.role !== "manager") {
    message("您没有该账套的管理权限，请申请授权", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要导入账套 "${row.accountName}" 吗？导入后原账套将移至回收站。`,
      "导入确认",
      {
        confirmButtonText: "确定导入",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const { code } = await importFreeAccountApi(row.uid);
    if (code === 200) {
      message("导入成功", { type: "success" });
      handleSearch();
    } else {
      message("导入失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("导入失败", { type: "error" });
    }
  }
};

const handleRequestAuth = async (row: FreeAccountItem) => {
  try {
    const { value } = await ElMessageBox.prompt(
      "请输入超级管理员或管理员的手机验证码",
      "申请授权",
      {
        confirmButtonText: "验证",
        cancelButtonText: "取消",
        inputPattern: /^\d{6}$/,
        inputErrorMessage: "请输入6位验证码"
      }
    );
    const { code } = await verifyFreeAccountAuthApi(row.uid, value);
    if (code === 200) {
      message("授权成功，可以导入账套", { type: "success" });
      handleSearch();
    } else {
      message("授权验证失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("授权验证失败", { type: "error" });
    }
  }
};

onMounted(() => {
  handleSearch();
});
</script>

<template>
  <div class="main">
    <PlusSearch
      v-model="state"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="formColumns"
      :show-number="2"
      label-width="80"
      label-position="right"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="bg-white p-4 rounded-md">
      <PureTableBar title="导入免费版账套" @refresh="handleSearch">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(Upload)"
            :disabled="selectedRows.length === 0"
            @click="handleBatchImport"
          >
            批量导入
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
            @selection-change="handleSelectionChange"
          >
            <template #operation="{ row }">
              <el-button
                v-if="row.role === 'admin' || row.role === 'manager'"
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(Check)"
                @click="handleImport(row)"
              >
                导入
              </el-button>
              <el-button
                v-else
                class="reset-margin"
                link
                type="warning"
                :size="size"
                @click="handleRequestAuth(row)"
              >
                申请授权
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

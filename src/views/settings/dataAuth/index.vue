<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils";
import {
  downloadBlob,
  downloadFromUrl,
  generateFilenameWithTimestamp
} from "@/utils/download";
import { exportDataAuthApi } from "@/api/setting";
import type { DataAuthUser, AuthItem } from "./types";
import { useDataAuthUsers } from "./composables/useDataAuthUsers";
import { useUserDataAuthDetail } from "./composables/useUserDataAuthDetail";
import {
  useAuthObjectSelector,
  type SelectType
} from "./composables/useAuthObjectSelector";
import UserTable from "./components/UserTable.vue";
import EditAuthDialog from "./components/EditAuthDialog.vue";
import ViewAuthDialog from "./components/ViewAuthDialog.vue";
import SelectAuthDialog from "./components/SelectAuthDialog.vue";

defineOptions({
  name: "DataAuth"
});

// 用户列表
const { loading, userList, loadData } = useDataAuthUsers();

// 当前用户
const currentUser = ref<DataAuthUser | null>(null);

// 对话框状态
const editDialogVisible = ref(false);
const viewDialogVisible = ref(false);

// 用户授权详情
const {
  detailLoading,
  customerList,
  supplierList,
  warehouseList,
  customerAuthMode,
  supplierAuthMode,
  warehouseAuthMode,
  loadUserAuthDetail,
  syncCustomers,
  reset: resetAuthDetail
} = useUserDataAuthDetail();

// 选择器
const {
  selectType,
  selectKeyword,
  selectLoading,
  selectList,
  selectSelectedRows,
  selectPagination,
  selectDialogTitle,
  selectColumns,
  loadSelectList,
  openSelectDialog,
  handleSelectSelectionChange,
  handleSelectPageChange,
  handleSelectSearch,
  handleSelectReset
} = useAuthObjectSelector();

const selectDialogVisible = ref(false);

// 打开编辑对话框
const openEditDialog = async (row: DataAuthUser) => {
  currentUser.value = row;
  resetAuthDetail();
  customerAuthMode.value = row.customerAuth ?? "partial";
  supplierAuthMode.value = row.supplierAuth ?? "partial";
  warehouseAuthMode.value = row.warehouseAuth ?? "partial";
  editDialogVisible.value = true;
  await loadUserAuthDetail(row.uid, row);
};

// 打开查看对话框
const openViewDialog = async (row: DataAuthUser) => {
  currentUser.value = row;
  customerList.value = [];
  viewDialogVisible.value = true;
  await loadUserAuthDetail(row.uid, row);
};

// 添加客户/供应商/仓库
const addCustomer = async () => {
  if (!currentUser.value?.uid) {
    message("请先选择用户", { type: "warning" });
    return;
  }
  await openSelectDialog("customer");
  selectDialogVisible.value = true;
};

const addSupplier = async () => {
  if (!currentUser.value?.uid) {
    message("请先选择用户", { type: "warning" });
    return;
  }
  await openSelectDialog("supplier");
  selectDialogVisible.value = true;
};

const addWarehouse = async () => {
  if (!currentUser.value?.uid) {
    message("请先选择用户", { type: "warning" });
    return;
  }
  await openSelectDialog("warehouse");
  selectDialogVisible.value = true;
};

// 同步客户
const handleSyncCustomers = async () => {
  if (!currentUser.value?.uid) return;
  await syncCustomers(currentUser.value.uid);
};

// 添加选中项到授权列表
const addSelectedToAuthList = () => {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  const targetList =
    selectType.value === "customer"
      ? customerList.value
      : selectType.value === "supplier"
        ? supplierList.value
        : warehouseList.value;

  const existing = new Set(targetList.map(i => i.uid));
  for (const row of selectSelectedRows.value) {
    if (!row?.uid || existing.has(row.uid)) continue;
    targetList.push({
      uid: row.uid,
      name: row.name,
      code: String(row.code ?? row.id ?? row.uid),
      authTime: now
    });
    existing.add(row.uid);
  }

  if (selectType.value === "customer") customerAuthMode.value = "partial";
  if (selectType.value === "supplier") supplierAuthMode.value = "partial";
  if (selectType.value === "warehouse") warehouseAuthMode.value = "partial";

  selectDialogVisible.value = false;
};

// 保存授权
const handleSaved = async () => {
  await loadData();
};

// 导出授权
const exportAuth = async () => {
  try {
    const res = await exportDataAuthApi();
    if (res instanceof Blob) {
      downloadBlob(
        res,
        generateFilenameWithTimestamp("data_auth_export", "xlsx"),
        {
          showMessage: true
        }
      );
      return;
    }

    const { code, data, msg } = res as {
      code: number;
      data: unknown;
      msg?: string;
    };
    if (code !== 200) {
      message(msg || "导出失败", { type: "error" });
      return;
    }

    const urlData = data as Record<string, unknown> | string | undefined;
    const url =
      typeof urlData === "string"
        ? urlData
        : ((urlData as Record<string, unknown>)?.url ??
          (urlData as Record<string, unknown>)?.downloadUrl ??
          (urlData as Record<string, unknown>)?.fileUrl ??
          urlData);
    if (typeof url === "string" && url.length > 0) {
      await downloadFromUrl(
        url,
        generateFilenameWithTimestamp("data_auth_export", "xlsx"),
        {
          showMessage: true
        }
      );
      return;
    }

    // 兜底：导出为 json
    const blob = new Blob([JSON.stringify(data ?? {}, null, 2)], {
      type: "application/json"
    });
    downloadBlob(
      blob,
      generateFilenameWithTimestamp("data_auth_export", "json"),
      {
        showMessage: true
      }
    );
  } catch {
    message("导出失败", { type: "error" });
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main">
    <div class="bg-white p-4 rounded-md">
      <UserTable
        :loading="loading"
        :user-list="userList"
        @edit="openEditDialog"
        @view="openViewDialog"
        @refresh="loadData"
      />
    </div>

    <!-- 编辑授权对话框 -->
    <EditAuthDialog
      v-model:visible="editDialogVisible"
      v-model:customer-list="customerList"
      v-model:supplier-list="supplierList"
      v-model:warehouse-list="warehouseList"
      v-model:customer-auth-mode="customerAuthMode"
      v-model:supplier-auth-mode="supplierAuthMode"
      v-model:warehouse-auth-mode="warehouseAuthMode"
      :current-user="currentUser"
      :detail-loading="detailLoading"
      @add-customer="addCustomer"
      @add-supplier="addSupplier"
      @add-warehouse="addWarehouse"
      @sync-customers="handleSyncCustomers"
      @saved="handleSaved"
    />

    <!-- 授权查看对话框 -->
    <ViewAuthDialog
      v-model:visible="viewDialogVisible"
      :current-user="currentUser"
      :customer-list="customerList"
      @export="exportAuth"
    />

    <!-- 选择授权对象对话框 -->
    <SelectAuthDialog
      v-model:visible="selectDialogVisible"
      v-model:select-keyword="selectKeyword"
      :select-type="selectType"
      :select-loading="selectLoading"
      :select-list="selectList"
      :select-selected-rows="selectSelectedRows"
      :select-pagination="selectPagination"
      :select-columns="selectColumns"
      @selection-change="handleSelectSelectionChange"
      @page-change="handleSelectPageChange"
      @search="handleSelectSearch"
      @reset="handleSelectReset"
      @confirm="addSelectedToAuthList"
    />
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import Plus from "~icons/ep/plus";
import Download from "~icons/ep/download";
import Refresh from "~icons/ep/refresh";
import { PureTableBar } from "@/components/RePureTableBar";
import { message } from "@/utils";
import { ElMessageBox } from "element-plus";
import type { DataAuthUser, AuthItem } from "./types";
import {
  exportDataAuthApi,
  getDataAuthUsersApi,
  getUserDataAuthApi,
  saveUserDataAuthApi,
  syncCustomerAuthApi
} from "@/api/setting";
import { getCustomerListApi } from "@/api/business/customer";
import { getProviderListApi } from "@/api/business/provider";
import { getRepoListApi } from "@/api/company/repo";

defineOptions({
  name: "DataAuth"
});

const loading = ref(false);
const detailLoading = ref(false);
const userList = ref<DataAuthUser[]>([]);
const editDialogVisible = ref(false);
const viewDialogVisible = ref(false);
const currentUser = ref<DataAuthUser | null>(null);
const activeAuthTab = ref("customer");

// 授权数据
const customerList = ref<AuthItem[]>([]);
const supplierList = ref<AuthItem[]>([]);
const warehouseList = ref<AuthItem[]>([]);
const customerAuthMode = ref<"all" | "partial">("partial");
const supplierAuthMode = ref<"all" | "partial">("partial");
const warehouseAuthMode = ref<"all" | "partial">("partial");

type SelectType = "customer" | "supplier" | "warehouse";
type SelectRow = {
  uid: string;
  id?: number;
  code?: string;
  name: string;
  phone?: string;
};

const selectDialogVisible = ref(false);
const selectType = ref<SelectType>("customer");
const selectKeyword = ref("");
const selectLoading = ref(false);
const selectList = ref<SelectRow[]>([]);
const selectSelectedRows = ref<SelectRow[]>([]);
const selectPagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const selectDialogTitle = computed(() => {
  if (selectType.value === "customer") return "选择客户";
  if (selectType.value === "supplier") return "选择供应商";
  return "选择仓库";
});

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

const authListColumns: TableColumnList = [
  {
    label: "编码",
    prop: "code",
    minWidth: 100
  },
  {
    label: "名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "授权时间",
    prop: "authTime",
    minWidth: 160
  },
  {
    label: "操作",
    width: 100,
    fixed: "right",
    slot: "operation"
  }
];

const selectColumns = computed<TableColumnList>(() => {
  const base: TableColumnList = [
    { type: "selection", width: 50 },
    {
      label: "编码",
      prop: "code",
      minWidth: 120,
      formatter: row => String(row.code ?? row.id ?? row.uid ?? "")
    },
    { label: "名称", prop: "name", minWidth: 180 }
  ];
  if (selectType.value !== "warehouse") {
    base.push({ label: "电话", prop: "phone", minWidth: 120 });
  }
  return base;
});

const normalizeAuthItems = (items: unknown): AuthItem[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item: any) => {
      const uid = String(item?.uid ?? item?.id ?? "");
      const name = String(item?.name ?? item?.username ?? "");
      const code = String(item?.code ?? item?.id ?? item?.uid ?? "");
      const authTime = String(
        item?.authTime ??
          item?.authAt ??
          item?.createdAt ??
          item?.createTime ??
          ""
      );
      return { uid, name, code, authTime } satisfies AuthItem;
    })
    .filter(i => i.uid && i.name);
};

const loadUserAuthDetail = async (userId: string) => {
  detailLoading.value = true;
  try {
    const { code, data, msg } = await getUserDataAuthApi(userId);
    if (code !== 200) {
      message(msg || "加载用户授权数据失败", { type: "error" });
      return;
    }

    const detail = data as any;
    customerList.value = normalizeAuthItems(
      detail?.customers ?? detail?.customerList
    );
    supplierList.value = normalizeAuthItems(
      detail?.suppliers ?? detail?.supplierList
    );
    warehouseList.value = normalizeAuthItems(
      detail?.warehouses ?? detail?.warehouseList
    );

    customerAuthMode.value =
      detail?.customerAuth ??
      detail?.customerAuthMode ??
      currentUser.value?.customerAuth ??
      "partial";
    supplierAuthMode.value =
      detail?.supplierAuth ??
      detail?.supplierAuthMode ??
      currentUser.value?.supplierAuth ??
      "partial";
    warehouseAuthMode.value =
      detail?.warehouseAuth ??
      detail?.warehouseAuthMode ??
      currentUser.value?.warehouseAuth ??
      "partial";
  } catch {
    message("加载用户授权数据失败", { type: "error" });
  } finally {
    detailLoading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const { code, data, msg } = await getDataAuthUsersApi();
    if (code !== 200) {
      message(msg || "加载数据授权用户列表失败", { type: "error" });
      return;
    }
    userList.value = Array.isArray(data)
      ? (data as DataAuthUser[])
      : (data?.list ?? []);
  } catch {
    message("加载数据授权用户列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const openEditDialog = async (row: DataAuthUser) => {
  currentUser.value = row;
  activeAuthTab.value = "customer";
  customerList.value = [];
  supplierList.value = [];
  warehouseList.value = [];
  customerAuthMode.value = row.customerAuth ?? "partial";
  supplierAuthMode.value = row.supplierAuth ?? "partial";
  warehouseAuthMode.value = row.warehouseAuth ?? "partial";
  editDialogVisible.value = true;
  await loadUserAuthDetail(row.uid);
};

const openViewDialog = async (row: DataAuthUser) => {
  currentUser.value = row;
  customerList.value = [];
  viewDialogVisible.value = true;
  await loadUserAuthDetail(row.uid);
};

const loadSelectList = async () => {
  selectLoading.value = true;
  try {
    const page = selectPagination.value.currentPage;
    if (selectType.value === "customer") {
      const { code, data, msg } = await getCustomerListApi(page, {
        keyword: selectKeyword.value || undefined
      });
      if (code !== 200) {
        message(msg || "加载客户列表失败", { type: "error" });
        return;
      }
      selectList.value = (data?.list ?? []) as SelectRow[];
      selectPagination.value.total = data?.count ?? data?.total ?? 0;
      return;
    }

    if (selectType.value === "supplier") {
      const { code, data, msg } = await getProviderListApi(page, {
        keyword: selectKeyword.value || undefined
      });
      if (code !== 200) {
        message(msg || "加载供应商列表失败", { type: "error" });
        return;
      }
      selectList.value = (data?.list ?? []) as SelectRow[];
      selectPagination.value.total = data?.count ?? data?.total ?? 0;
      return;
    }

    const { code, data, msg } = await getRepoListApi(page, {
      keyword: selectKeyword.value || undefined
    });
    if (code !== 200) {
      message(msg || "加载仓库列表失败", { type: "error" });
      return;
    }
    selectList.value = (data?.list ?? []) as SelectRow[];
    selectPagination.value.total = data?.count ?? data?.total ?? 0;
  } catch {
    message("加载选择列表失败", { type: "error" });
  } finally {
    selectLoading.value = false;
  }
};

const openSelectDialog = async (type: SelectType) => {
  if (!currentUser.value?.uid) {
    message("请先选择用户", { type: "warning" });
    return;
  }
  selectType.value = type;
  selectKeyword.value = "";
  selectSelectedRows.value = [];
  selectPagination.value.currentPage = 1;
  selectDialogVisible.value = true;
  await loadSelectList();
};

const addCustomer = async () => {
  await openSelectDialog("customer");
};

const addSupplier = async () => {
  await openSelectDialog("supplier");
};

const addWarehouse = async () => {
  await openSelectDialog("warehouse");
};

const handleSelectSelectionChange = (rows: SelectRow[]) => {
  selectSelectedRows.value = rows;
};

const handleSelectPageChange = (page: number) => {
  selectPagination.value.currentPage = page;
  loadSelectList();
};

const handleSelectSearch = () => {
  selectPagination.value.currentPage = 1;
  loadSelectList();
};

const handleSelectReset = () => {
  selectKeyword.value = "";
  selectPagination.value.currentPage = 1;
  loadSelectList();
};

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

const syncCustomers = async () => {
  try {
    await ElMessageBox.confirm(
      "将同步该用户自己创建的客户到授权列表，是否继续？",
      "同步客户",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info"
      }
    );
    if (!currentUser.value?.uid) return;
    detailLoading.value = true;
    const { code, msg } = await syncCustomerAuthApi(currentUser.value.uid);
    if (code === 200) {
      message("同步成功", { type: "success" });
      await loadUserAuthDetail(currentUser.value.uid);
    } else {
      message(msg || "同步失败", { type: "error" });
    }
  } catch {
    // cancelled
  } finally {
    detailLoading.value = false;
  }
};

const removeAuthItem = async (list: AuthItem[], item: AuthItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除 "${item.name}" 的授权吗？`,
      "移除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const index = list.findIndex(i => i.uid === item.uid);
    if (index > -1) {
      list.splice(index, 1);
    }
    message("移除成功", { type: "success" });
  } catch {
    // cancelled
  }
};

const clearAll = async (list: AuthItem[]) => {
  try {
    await ElMessageBox.confirm("确定要清空所有授权吗？", "清空确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    list.length = 0;
    message("清空成功", { type: "success" });
  } catch {
    // cancelled
  }
};

const saveAuth = async () => {
  if (!currentUser.value?.uid) return;
  detailLoading.value = true;
  try {
    const payload = {
      customerAuth: customerAuthMode.value,
      supplierAuth: supplierAuthMode.value,
      warehouseAuth: warehouseAuthMode.value,
      customers:
        customerAuthMode.value === "all"
          ? []
          : customerList.value.map(i => i.uid),
      suppliers:
        supplierAuthMode.value === "all"
          ? []
          : supplierList.value.map(i => i.uid),
      warehouses:
        warehouseAuthMode.value === "all"
          ? []
          : warehouseList.value.map(i => i.uid)
    };

    const { code, msg } = await saveUserDataAuthApi(
      currentUser.value.uid,
      payload
    );
    if (code !== 200) {
      message(msg || "保存失败", { type: "error" });
      return;
    }
    message("保存成功", { type: "success" });
    editDialogVisible.value = false;
    await loadData();
  } catch {
    message("保存失败", { type: "error" });
  } finally {
    detailLoading.value = false;
  }
};

const exportAuth = async () => {
  try {
    const res: any = await exportDataAuthApi();
    if (res instanceof Blob) {
      const url = window.URL.createObjectURL(res);
      const link = document.createElement("a");
      link.href = url;
      link.download = `data_auth_export_${Date.now()}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      message("导出成功", { type: "success" });
      return;
    }

    const { code, data, msg } = res as {
      code: number;
      data: any;
      msg?: string;
    };
    if (code !== 200) {
      message(msg || "导出失败", { type: "error" });
      return;
    }

    const url = data?.url ?? data?.downloadUrl ?? data?.fileUrl ?? data;
    if (typeof url === "string" && url.length > 0) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
      message("导出成功", { type: "success" });
      return;
    }

    // 兜底：导出为 json
    const blob = new Blob([JSON.stringify(data ?? {}, null, 2)], {
      type: "application/json"
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `data_auth_export_${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(blobUrl);
    message("导出成功", { type: "success" });
  } catch {
    message("导出失败", { type: "error" });
  }
};

watch(customerAuthMode, mode => {
  if (mode === "all") customerList.value = [];
});
watch(supplierAuthMode, mode => {
  if (mode === "all") supplierList.value = [];
});
watch(warehouseAuthMode, mode => {
  if (mode === "all") warehouseList.value = [];
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main">
    <div class="bg-white p-4 rounded-md">
      <PureTableBar title="数据授权" @refresh="loadData">
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
                @click="openEditDialog(row)"
              >
                编辑授权
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(View)"
                @click="openViewDialog(row)"
              >
                授权查看
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>

    <!-- 编辑授权对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="`编辑授权 - ${currentUser?.username}`"
      width="800px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeAuthTab">
        <el-tab-pane label="客户授权" name="customer">
          <div class="flex justify-between mb-4">
            <div>
              <el-radio-group
                v-model="customerAuthMode"
                :disabled="detailLoading"
              >
                <el-radio-button value="all">全部客户</el-radio-button>
                <el-radio-button value="partial">部分客户</el-radio-button>
              </el-radio-group>
            </div>
            <div class="space-x-2">
              <el-button
                :icon="useRenderIcon(Plus)"
                :disabled="detailLoading || customerAuthMode === 'all'"
                @click="addCustomer"
              >
                添加客户
              </el-button>
              <el-button
                :icon="useRenderIcon(Refresh)"
                :disabled="detailLoading || customerAuthMode === 'all'"
                @click="syncCustomers"
              >
                同步客户
              </el-button>
              <el-button
                type="danger"
                :icon="useRenderIcon(Delete)"
                :disabled="detailLoading"
                @click="clearAll(customerList)"
              >
                全部清空
              </el-button>
            </div>
          </div>
          <pure-table
            border
            :data="customerList"
            :columns="authListColumns"
            max-height="300"
          >
            <template #operation="{ row }">
              <el-button
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="removeAuthItem(customerList, row)"
              >
                移除
              </el-button>
            </template>
          </pure-table>
        </el-tab-pane>

        <el-tab-pane label="供应商授权" name="supplier">
          <div class="flex justify-between mb-4">
            <div>
              <el-radio-group
                v-model="supplierAuthMode"
                :disabled="detailLoading"
              >
                <el-radio-button value="all">全部供应商</el-radio-button>
                <el-radio-button value="partial">部分供应商</el-radio-button>
              </el-radio-group>
            </div>
            <div class="space-x-2">
              <el-button
                :icon="useRenderIcon(Plus)"
                :disabled="detailLoading || supplierAuthMode === 'all'"
                @click="addSupplier"
              >
                添加供应商
              </el-button>
              <el-button
                type="danger"
                :icon="useRenderIcon(Delete)"
                :disabled="detailLoading"
                @click="clearAll(supplierList)"
              >
                全部清空
              </el-button>
            </div>
          </div>
          <pure-table
            border
            :data="supplierList"
            :columns="authListColumns"
            max-height="300"
          >
            <template #operation="{ row }">
              <el-button
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="removeAuthItem(supplierList, row)"
              >
                移除
              </el-button>
            </template>
          </pure-table>
        </el-tab-pane>

        <el-tab-pane label="仓库授权" name="warehouse">
          <div class="flex justify-between mb-4">
            <div>
              <el-radio-group
                v-model="warehouseAuthMode"
                :disabled="detailLoading"
              >
                <el-radio-button value="all">全部仓库</el-radio-button>
                <el-radio-button value="partial">部分仓库</el-radio-button>
              </el-radio-group>
            </div>
            <div class="space-x-2">
              <el-button
                :icon="useRenderIcon(Plus)"
                :disabled="detailLoading || warehouseAuthMode === 'all'"
                @click="addWarehouse"
              >
                添加仓库
              </el-button>
              <el-button
                type="danger"
                :icon="useRenderIcon(Delete)"
                :disabled="detailLoading"
                @click="clearAll(warehouseList)"
              >
                全部清空
              </el-button>
            </div>
          </div>
          <pure-table
            border
            :data="warehouseList"
            :columns="authListColumns"
            max-height="300"
          >
            <template #operation="{ row }">
              <el-button
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="removeAuthItem(warehouseList, row)"
              >
                移除
              </el-button>
            </template>
          </pure-table>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="detailLoading" @click="saveAuth">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 授权查看对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="`授权查看 - ${currentUser?.username}`"
      width="600px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="flex justify-end mb-4">
        <el-button :icon="useRenderIcon(Download)" @click="exportAuth">
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
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 选择授权对象对话框 -->
    <el-dialog
      v-model="selectDialogVisible"
      :title="selectDialogTitle"
      width="800px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="flex justify-between mb-4">
        <el-input
          v-model="selectKeyword"
          placeholder="请输入关键字"
          clearable
          class="w-72"
          @keyup.enter="handleSelectSearch"
        />
        <div class="space-x-2">
          <el-button @click="handleSelectReset">重置</el-button>
          <el-button type="primary" @click="handleSelectSearch">查询</el-button>
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
        @selection-change="handleSelectSelectionChange"
      />
      <div class="flex justify-end mt-4">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="selectPagination.total"
          :page-size="selectPagination.pageSize"
          :current-page="selectPagination.currentPage"
          @current-change="handleSelectPageChange"
        />
      </div>
      <template #footer>
        <el-button @click="selectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSelectedToAuthList">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 20px;
}
</style>

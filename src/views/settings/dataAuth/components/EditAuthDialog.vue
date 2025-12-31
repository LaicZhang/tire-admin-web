<script setup lang="ts">
import { ref, watch } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";
import Refresh from "~icons/ep/refresh";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils";
import { saveUserDataAuthApi } from "@/api/setting";
import type { DataAuthUser, AuthItem } from "../types";
import type {
  useUserDataAuthDetail,
  useAuthObjectSelector
} from "../composables";

const props = defineProps<{
  visible: boolean;
  currentUser: DataAuthUser | null;
  detailLoading: boolean;
  customerList: AuthItem[];
  supplierList: AuthItem[];
  warehouseList: AuthItem[];
  customerAuthMode: "all" | "partial";
  supplierAuthMode: "all" | "partial";
  warehouseAuthMode: "all" | "partial";
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:customerAuthMode": [value: "all" | "partial"];
  "update:supplierAuthMode": [value: "all" | "partial"];
  "update:warehouseAuthMode": [value: "all" | "partial"];
  "update:customerList": [value: AuthItem[]];
  "update:supplierList": [value: AuthItem[]];
  "update:warehouseList": [value: AuthItem[]];
  "add-customer": [];
  "add-supplier": [];
  "add-warehouse": [];
  "sync-customers": [];
  saved: [];
}>();

const activeAuthTab = ref("customer");

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

const removeAuthItem = async (
  list: AuthItem[],
  item: AuthItem,
  type: "customer" | "supplier" | "warehouse"
) => {
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
    const newList = list.filter(i => i.uid !== item.uid);
    emit(`update:${type}List`, newList);
    message("移除成功", { type: "success" });
  } catch {
    // cancelled
  }
};

const clearAll = async (
  list: AuthItem[],
  type: "customer" | "supplier" | "warehouse"
) => {
  try {
    await ElMessageBox.confirm("确定要清空所有授权吗？", "清空确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    const newList: AuthItem[] = [];
    emit(`update:${type}List`, newList);
    message("清空成功", { type: "success" });
  } catch {
    // cancelled
  }
};

const saveAuth = async () => {
  if (!props.currentUser?.uid) return;
  try {
    const payload = {
      customerAuth: props.customerAuthMode,
      supplierAuth: props.supplierAuthMode,
      warehouseAuth: props.warehouseAuthMode,
      customers:
        props.customerAuthMode === "all"
          ? []
          : props.customerList.map(i => i.uid),
      suppliers:
        props.supplierAuthMode === "all"
          ? []
          : props.supplierList.map(i => i.uid),
      warehouses:
        props.warehouseAuthMode === "all"
          ? []
          : props.warehouseList.map(i => i.uid)
    };

    const { code, msg } = await saveUserDataAuthApi(
      props.currentUser.uid,
      payload
    );
    if (code !== 200) {
      message(msg || "保存失败", { type: "error" });
      return;
    }
    message("保存成功", { type: "success" });
    emit("update:visible", false);
    emit("saved");
  } catch {
    message("保存失败", { type: "error" });
  }
};

watch(
  () => props.visible,
  val => {
    if (val) {
      activeAuthTab.value = "customer";
    }
  }
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="`编辑授权 - ${currentUser?.username}`"
    width="800px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-tabs v-model="activeAuthTab">
      <el-tab-pane label="客户授权" name="customer">
        <div class="flex justify-between mb-4">
          <div>
            <el-radio-group
              :model-value="customerAuthMode"
              :disabled="detailLoading"
              @update:model-value="emit('update:customerAuthMode', $event)"
            >
              <el-radio-button value="all">全部客户</el-radio-button>
              <el-radio-button value="partial">部分客户</el-radio-button>
            </el-radio-group>
          </div>
          <div class="space-x-2">
            <el-button
              :icon="useRenderIcon(Plus)"
              :disabled="detailLoading || customerAuthMode === 'all'"
              @click="emit('add-customer')"
            >
              添加客户
            </el-button>
            <el-button
              :icon="useRenderIcon(Refresh)"
              :disabled="detailLoading || customerAuthMode === 'all'"
              @click="emit('sync-customers')"
            >
              同步客户
            </el-button>
            <el-button
              type="danger"
              :icon="useRenderIcon(Delete)"
              :disabled="detailLoading"
              @click="clearAll(customerList, 'customer')"
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
              @click="removeAuthItem(customerList, row, 'customer')"
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
              :model-value="supplierAuthMode"
              :disabled="detailLoading"
              @update:model-value="emit('update:supplierAuthMode', $event)"
            >
              <el-radio-button value="all">全部供应商</el-radio-button>
              <el-radio-button value="partial">部分供应商</el-radio-button>
            </el-radio-group>
          </div>
          <div class="space-x-2">
            <el-button
              :icon="useRenderIcon(Plus)"
              :disabled="detailLoading || supplierAuthMode === 'all'"
              @click="emit('add-supplier')"
            >
              添加供应商
            </el-button>
            <el-button
              type="danger"
              :icon="useRenderIcon(Delete)"
              :disabled="detailLoading"
              @click="clearAll(supplierList, 'supplier')"
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
              @click="removeAuthItem(supplierList, row, 'supplier')"
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
              :model-value="warehouseAuthMode"
              :disabled="detailLoading"
              @update:model-value="emit('update:warehouseAuthMode', $event)"
            >
              <el-radio-button value="all">全部仓库</el-radio-button>
              <el-radio-button value="partial">部分仓库</el-radio-button>
            </el-radio-group>
          </div>
          <div class="space-x-2">
            <el-button
              :icon="useRenderIcon(Plus)"
              :disabled="detailLoading || warehouseAuthMode === 'all'"
              @click="emit('add-warehouse')"
            >
              添加仓库
            </el-button>
            <el-button
              type="danger"
              :icon="useRenderIcon(Delete)"
              :disabled="detailLoading"
              @click="clearAll(warehouseList, 'warehouse')"
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
              @click="removeAuthItem(warehouseList, row, 'warehouse')"
            >
              移除
            </el-button>
          </template>
        </pure-table>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="detailLoading" @click="saveAuth">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

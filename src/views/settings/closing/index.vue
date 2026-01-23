<script setup lang="tsx">
import { h, onMounted, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Check from "~icons/ep/check";
import Close from "~icons/ep/close";
import { handleApiError, message } from "@/utils";
import { getClosingRecordsApi } from "@/api/setting";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import type { ClosingRecord } from "./types";
import ClosingCheckForm from "./ClosingCheckForm.vue";

defineOptions({
  name: "Closing"
});

const tableLoading = ref(false);
const closingRecords = ref<ClosingRecord[]>([]);

function parseListData<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "list" in data) {
    const list = (data as { list?: unknown }).list;
    if (Array.isArray(list)) return list as T[];
  }
  return [];
}

const loadData = async () => {
  tableLoading.value = true;
  try {
    const res = await getClosingRecordsApi();
    if (res.code !== 200) {
      message(res.msg || "加载结账记录失败", { type: "error" });
      closingRecords.value = [];
      return;
    }

    const records = parseListData<unknown>(res.data).filter(
      (item): item is ClosingRecord => !!item && typeof item === "object"
    );
    closingRecords.value = records.sort((a, b) => {
      const op = (b.operationDate || "").localeCompare(a.operationDate || "");
      if (op !== 0) return op;
      return (b.closingDate || "").localeCompare(a.closingDate || "");
    });
  } catch (error) {
    closingRecords.value = [];
    handleApiError(error, "加载结账记录失败");
  } finally {
    tableLoading.value = false;
  }
};

const openClosingDialog = () => {
  addDialog({
    title: "结账",
    width: "600px",
    draggable: true,
    closeOnClickModal: false,
    destroyOnClose: true,
    hideFooter: true,
    contentRenderer: () =>
      h(ClosingCheckForm, {
        isClosing: true,
        initialDate: "",
        onSuccess: () => {
          closeAllDialog();
          loadData();
        },
        onClose: () => {
          closeAllDialog();
        }
      })
  });
};

const openUnclosingDialog = () => {
  const latestClosed = closingRecords.value.find(r => r.status === "closed");
  if (!latestClosed) {
    message("没有可反结账的记录", { type: "warning" });
    return;
  }

  addDialog({
    title: "反结账",
    width: "600px",
    draggable: true,
    closeOnClickModal: false,
    destroyOnClose: true,
    hideFooter: true,
    contentRenderer: () =>
      h(ClosingCheckForm, {
        isClosing: false,
        initialDate: latestClosed.closingDate,
        onSuccess: () => {
          closeAllDialog();
          loadData();
        },
        onClose: () => {
          closeAllDialog();
        }
      })
  });
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main">
    <div class="bg-white p-6 rounded-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium">结账与反结账</h3>
        <div class="space-x-2">
          <el-button
            type="primary"
            :icon="useRenderIcon(Check)"
            @click="openClosingDialog"
          >
            结账
          </el-button>
          <el-button
            type="warning"
            :icon="useRenderIcon(Close)"
            @click="openUnclosingDialog"
          >
            反结账
          </el-button>
        </div>
      </div>

      <el-alert
        title="结账日期不能小于系统启用日期，也不能小于或等于上次结账日期。结账日期之前的数据只能查询，不能修改。"
        type="info"
        :closable="false"
        class="mb-4"
      />

      <pure-table
        border
        row-key="uid"
        alignWhole="center"
        showOverflowTooltip
        :loading="tableLoading"
        :data="closingRecords"
        :columns="columns"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}
</style>

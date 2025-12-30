<script setup lang="tsx">
import { onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Check from "~icons/ep/check";
import Close from "~icons/ep/close";
import { handleApiError, message } from "@/utils";
import { ElMessageBox } from "element-plus";
import {
  executeClosingApi,
  getClosingRecordsApi,
  runClosingChecksApi
} from "@/api/setting";
import type { ClosingRecord, ClosingCheckItem } from "./types";

defineOptions({
  name: "Closing"
});

const tableLoading = ref(false);
const actionLoading = ref(false);
const closingRecords = ref<ClosingRecord[]>([]);
const checkDialogVisible = ref(false);
const checkItems = ref<ClosingCheckItem[]>([]);
const checkLoading = ref(false);
const closingDate = ref("");
const isClosing = ref(true);

const columns: TableColumnList = [
  {
    label: "结账日",
    prop: "closingDate",
    minWidth: 120
  },
  {
    label: "操作日期",
    prop: "operationDate",
    minWidth: 160
  },
  {
    label: "操作员",
    prop: "operatorName",
    minWidth: 100
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <el-tag
        type={row.status === "closed" ? "success" : "info"}
        effect="plain"
      >
        {row.status === "closed" ? "已结账" : "已反结账"}
      </el-tag>
    )
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 200
  }
];

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
  isClosing.value = true;
  closingDate.value = "";
  checkItems.value = [];
  checkDialogVisible.value = true;
};

const openUnclosingDialog = () => {
  const latestClosed = closingRecords.value.find(r => r.status === "closed");
  if (!latestClosed) {
    message("没有可反结账的记录", { type: "warning" });
    return;
  }
  isClosing.value = false;
  closingDate.value = latestClosed.closingDate;
  checkItems.value = [];
  checkDialogVisible.value = true;
};

const runCheck = async () => {
  if (!closingDate.value) {
    message("请选择结账日期", { type: "warning" });
    return;
  }
  checkLoading.value = true;
  try {
    const res = await runClosingChecksApi(closingDate.value);
    if (res.code !== 200) {
      message(res.msg || "运行结账检查失败", { type: "error" });
      checkItems.value = [];
      return;
    }

    const rawItems = parseListData<unknown>(res.data).filter(
      (item): item is Partial<ClosingCheckItem> =>
        !!item && typeof item === "object"
    );
    checkItems.value = rawItems.map((item, index) => ({
      id: item.id || String(index + 1),
      name: item.name || "",
      description: item.description || "",
      passed: !!item.passed,
      errorMessage: item.errorMessage
    }));
  } catch (error) {
    checkItems.value = [];
    handleApiError(error, "运行结账检查失败");
  } finally {
    checkLoading.value = false;
  }
};

const doClosing = async () => {
  if (!closingDate.value) {
    message(isClosing.value ? "请选择结账日期" : "反结账日期为空", {
      type: "warning"
    });
    return;
  }
  const failedItems = checkItems.value.filter(item => !item.passed);
  if (failedItems.length > 0) {
    message("存在未通过的检查项，请先处理", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      isClosing.value
        ? `确定要结账到 ${closingDate.value} 吗？结账后该日期之前的数据将不能修改。`
        : `确定要反结账 ${closingDate.value} 吗？`,
      isClosing.value ? "结账确认" : "反结账确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    actionLoading.value = true;

    const action = isClosing.value ? "close" : "unclose";
    const res = await executeClosingApi(closingDate.value, action);
    if (res.code !== 200) {
      message(res.msg || (isClosing.value ? "结账失败" : "反结账失败"), {
        type: "error"
      });
      return;
    }

    message(res.msg || (isClosing.value ? "结账成功" : "反结账成功"), {
      type: "success"
    });
    checkDialogVisible.value = false;
    checkItems.value = [];
    await loadData();
  } catch (error) {
    if (error !== "cancel" && error !== "close") {
      handleApiError(error, isClosing.value ? "结账失败" : "反结账失败");
    }
  } finally {
    actionLoading.value = false;
  }
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

    <!-- 结账/反结账对话框 -->
    <el-dialog
      v-model="checkDialogVisible"
      :title="isClosing ? '结账' : '反结账'"
      width="600px"
      destroy-on-close
    >
      <div class="mb-4">
        <el-form label-width="100px">
          <el-form-item :label="isClosing ? '结账日期' : '反结账日期'">
            <el-date-picker
              v-if="isClosing"
              v-model="closingDate"
              type="date"
              placeholder="选择结账日期"
              value-format="YYYY-MM-DD"
            />
            <span v-else class="font-medium">{{ closingDate }}</span>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="checkItems.length > 0" class="mb-4">
        <div class="text-sm font-medium text-gray-600 mb-2">检查结果</div>
        <el-table :data="checkItems" border size="small">
          <el-table-column prop="name" label="检查项" width="120" />
          <el-table-column prop="description" label="说明" />
          <el-table-column
            prop="passed"
            label="结果"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-icon v-if="row.passed" class="text-green-500"
                ><Check
              /></el-icon>
              <el-icon v-else class="text-red-500"><Close /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="errorMessage" label="错误信息" />
        </el-table>
      </div>

      <template #footer>
        <el-button @click="checkDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="checkLoading" @click="runCheck">
          {{ checkItems.length > 0 ? "重新检查" : "开始检查" }}
        </el-button>
        <el-button
          v-if="checkItems.length > 0"
          type="success"
          :loading="actionLoading"
          :disabled="checkItems.some(item => !item.passed)"
          @click="doClosing"
        >
          {{ isClosing ? "确定结账" : "确定反结账" }}
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

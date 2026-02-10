<script setup lang="tsx">
import { ref, computed } from "vue";
import Check from "~icons/ep/check";
import Close from "~icons/ep/close";
import { handleApiError, message } from "@/utils";
import { executeClosingApi, runClosingChecksApi } from "@/api/setting";
import type { ClosingCheckItem } from "./types";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { parseListData } from "./utils";

const props = defineProps<{
  isClosing: boolean;
  initialDate: string;
  onSuccess: () => void;
  onClose: () => void;
}>();

const closingDate = ref(props.initialDate);
const checkItems = ref<ClosingCheckItem[]>([]);
const checkLoading = ref(false);
const actionLoading = ref(false);
const { confirm } = useConfirmDialog();

const checkColumns: TableColumnList = [
  { label: "检查项", prop: "name", width: 120 },
  { label: "说明", prop: "description" },
  {
    label: "结果",
    prop: "passed",
    width: 100,
    align: "center",
    slot: "passed"
  },
  { label: "错误信息", prop: "errorMessage" }
];

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
    message(props.isClosing ? "请选择结账日期" : "反结账日期为空", {
      type: "warning"
    });
    return;
  }
  const failedItems = checkItems.value.filter(item => !item.passed);
  if (failedItems.length > 0) {
    message("存在未通过的检查项，请先处理", { type: "warning" });
    return;
  }
  const ok = await confirm(
    props.isClosing
      ? `确定要结账到 ${closingDate.value} 吗？结账后该日期之前的数据将不能修改。`
      : `确定要反结账 ${closingDate.value} 吗？`,
    props.isClosing ? "结账确认" : "反结账确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  );
  if (!ok) return;

  try {
    actionLoading.value = true;
    const action = props.isClosing ? "close" : "unclose";
    const res = await executeClosingApi(closingDate.value, action);
    if (res.code !== 200) {
      message(res.msg || (props.isClosing ? "结账失败" : "反结账失败"), {
        type: "error"
      });
      return;
    }

    message(res.msg || (props.isClosing ? "结账成功" : "反结账成功"), {
      type: "success"
    });
    props.onSuccess();
  } catch (error) {
    handleApiError(error, props.isClosing ? "结账失败" : "反结账失败");
  } finally {
    actionLoading.value = false;
  }
};

const hasFailedItems = computed(() =>
  checkItems.value.some(item => !item.passed)
);
</script>

<template>
  <div>
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
      <pure-table
        border
        size="small"
        :data="checkItems"
        :columns="checkColumns"
      >
        <template #passed="{ row }">
          <el-icon v-if="row.passed" class="text-green-500"><Check /></el-icon>
          <el-icon v-else class="text-red-500"><Close /></el-icon>
        </template>
      </pure-table>
    </div>

    <div class="flex justify-end gap-2">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="checkLoading" @click="runCheck">
        {{ checkItems.length > 0 ? "重新检查" : "开始检查" }}
      </el-button>
      <el-button
        v-if="checkItems.length > 0"
        type="success"
        :loading="actionLoading"
        :disabled="hasFailedItems"
        @click="doClosing"
      >
        {{ isClosing ? "确定结账" : "确定反结账" }}
      </el-button>
    </div>
  </div>
</template>

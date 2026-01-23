<script setup lang="ts">
import { h, ref, reactive } from "vue";
import { columns } from "./columns";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import StatusTag from "@/components/StatusTag/index.vue";
import { APPROVAL_STATUS_MAP } from "@/components/StatusTag/types";
import {
  getWriteOffList,
  approveWriteOff,
  rejectWriteOff,
  deleteWriteOff,
  type WriteOffOrder
} from "@/api/business/writeOff";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import WriteOffForm from "./WriteOffForm.vue";

defineOptions({
  name: "WriteOffList"
});

const form = ref({
  type: "",
  isApproved: ""
});

const dataList = ref<WriteOffOrder[]>([]);
const loading = ref(true);
const pagination = ref({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getWriteOffList({
      index: pagination.value.currentPage,
      type: form.value.type || undefined,
      isApproved: form.value.isApproved || undefined
    });
    dataList.value = data.list;
    pagination.value.total = data.count;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "获取核销单列表失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

function onReset() {
  searchFormRef.value?.resetFields();
  onSearch();
}

function handleAdd() {
  addDialog({
    title: "新建核销单",
    width: "600px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(WriteOffForm, {
        onSuccess: () => {
          closeAllDialog();
          onSearch();
        },
        onClose: () => closeAllDialog()
      })
  });
}

async function handleApprove(row: WriteOffOrder) {
  try {
    await ElMessageBox.confirm("确定审核通过该核销单吗？", "提示", {
      type: "warning"
    });
    await approveWriteOff(row.uid);
    message("审核成功", { type: "success" });
    onSearch();
  } catch (e: unknown) {
    if (e !== "cancel") {
      const msg = e instanceof Error ? e.message : "审核失败";
      message(msg, { type: "error" });
    }
  }
}

async function handleReject(row: WriteOffOrder) {
  try {
    await ElMessageBox.confirm("确定拒绝该核销单吗？", "提示", {
      type: "warning"
    });
    await rejectWriteOff(row.uid);
    message("已拒绝", { type: "success" });
    onSearch();
  } catch (e: unknown) {
    if (e !== "cancel") {
      const msg = e instanceof Error ? e.message : "拒绝失败";
      message(msg, { type: "error" });
    }
  }
}

async function handleDelete(row: WriteOffOrder) {
  try {
    await ElMessageBox.confirm("确定删除该核销单吗？", "提示", {
      type: "warning"
    });
    await deleteWriteOff(row.uid);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e: unknown) {
    if (e !== "cancel") {
      const msg = e instanceof Error ? e.message : "删除失败";
      message(msg, { type: "error" });
    }
  }
}

onSearch();
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="核销类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[160px]"
        >
          <el-option label="互抵核销" value="OFFSET" />
          <el-option label="坏账核销" value="BAD_DEBT" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态" prop="isApproved">
        <el-select
          v-model="form.isApproved"
          placeholder="请选择状态"
          clearable
          class="w-[160px]"
        >
          <el-option label="待审核" value="false" />
          <el-option label="已审核" value="true" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="核销单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建核销单
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="val => (pagination.pageSize = val) && onSearch()"
          @page-current-change="
            val => (pagination.currentPage = val) && onSearch()
          "
        >
          <template #status="{ row }">
            <StatusTag
              :status="row.isApproved"
              :status-map="APPROVAL_STATUS_MAP"
            />
          </template>
          <template #operation="{ row, size }">
            <el-button
              v-if="!row.isApproved"
              link
              type="primary"
              :size="size"
              @click="handleApprove(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="!row.isApproved"
              link
              type="warning"
              :size="size"
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="!row.isApproved"
              link
              type="danger"
              :size="size"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <span v-if="row.isApproved" class="text-gray-400">-</span>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

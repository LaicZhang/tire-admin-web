<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref } from "vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import StatusTag from "@/components/StatusTag/index.vue";
import type { StatusConfig } from "@/components/StatusTag/types";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { getStatementList, type Statement } from "@/api/business/statement";
import { message } from "@/utils/message";

defineOptions({
  name: "StatementList"
});

const STATEMENT_STATUS_MAP: Record<string, StatusConfig> = {
  DRAFT: { label: "草稿", type: "warning" },
  CONFIRMED: { label: "已确认", type: "success" },
  VOID: { label: "已作废", type: "info" }
};

const form = ref({
  type: "",
  targetName: "",
  status: ""
});

const dataList = ref<Statement[]>([]);
const loading = ref(true);
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getStatementList({
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize,
      ...form.value
    });
    dataList.value = data.list;
    pagination.value.total = data.total ?? data.count;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "查询失败";
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
  message("功能开发中", { type: "info" });
}

function handleDetail(_row: Statement) {
  message("功能开发中", { type: "info" });
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
      <el-form-item label="对账类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[160px]"
        >
          <el-option label="客户对账" value="CUSTOMER" />
          <el-option label="供应商对账" value="PROVIDER" />
        </el-select>
      </el-form-item>
      <el-form-item label="往来单位" prop="targetName">
        <el-input
          v-model="form.targetName"
          placeholder="请输入单位名称"
          clearable
          class="w-[160px]"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="对账单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建对账
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
              :status="row.status"
              :status-map="STATEMENT_STATUS_MAP"
            />
          </template>
          <template #operation="{ row }">
            <el-button
              link
              type="primary"
              :size="size"
              @click="handleDetail(row)"
            >
              查看
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

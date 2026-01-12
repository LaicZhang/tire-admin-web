<script setup lang="ts">
import { ref } from "vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getAdvancePaymentList,
  type AdvancePaymentDto
} from "@/api/business/advance-payment";
import { message } from "@/utils/message";

defineOptions({
  name: "AdvancePaymentList"
});

const form = ref({
  type: "",
  targetName: ""
});

const dataList = ref<AdvancePaymentDto[]>([]);
const loading = ref(true);
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns: TableColumnList = [
  {
    label: "单号",
    prop: "billNo",
    minWidth: 160
  },
  {
    label: "类型",
    prop: "type",
    minWidth: 100,
    formatter: ({ type }) => (type === "RECEIPT" ? "预收款" : "预付款")
  },
  {
    label: "往来单位",
    prop: "targetName",
    minWidth: 160
  },
  {
    label: "金额",
    prop: "amount",
    minWidth: 120
  },
  {
    label: "剩余金额",
    prop: "remainingAmount",
    minWidth: 120
  },
  {
    label: "付款方式",
    prop: "paymentMethod",
    minWidth: 120
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 140,
    slot: "operation"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getAdvancePaymentList({
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

onSearch();

function handleAdd() {
  message("功能开发中", { type: "info" });
}

function handleDelete(_row: AdvancePaymentDto) {
  message("功能开发中", { type: "info" });
}
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
      <el-form-item label="相关类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[160px]"
        >
          <el-option label="预收款" value="RECEIPT" />
          <el-option label="预付款" value="PAYMENT" />
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

    <PureTableBar title="预收预付列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建
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
          <template #operation="{ row }">
            <DeleteButton
              :show-icon="false"
              size="small"
              @confirm="handleDelete(row)"
            />
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

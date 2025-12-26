<script setup lang="ts">
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete"; // Added import
import {
  getAdvancePaymentList,
  type AdvancePayment
} from "@/api/business/advance-payment";
import { message } from "@/utils/message";

defineOptions({
  name: "AdvancePaymentList"
});

const form = ref({
  type: "",
  targetName: ""
});

const dataList = ref<AdvancePayment[]>([]);
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

function resetForm(formEl: { resetFields: () => void } | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
}

onSearch();

const formRef = ref();

function handleAdd() {
  message("功能开发中", { type: "info" });
}

function handleDelete(_row: AdvancePayment) {
  message("功能开发中", { type: "info" });
}
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="相关类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[160px]!"
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
          class="w-[160px]!"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

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
            <el-popconfirm
              :title="`确认删除该记录吗?`"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="primary" :size="size"> 删除 </el-button>
              </template>
            </el-popconfirm>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

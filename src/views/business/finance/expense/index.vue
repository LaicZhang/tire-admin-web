<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getOtherTransactionListApi } from "@/api/finance";
import type { OtherTransaction } from "@/api/finance";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Add from "~icons/ep/plus";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "FinanceExpense"
});

const loading = ref(true);
const dataList = ref<OtherTransaction[]>([]);
const formRef = ref<FormInstance>();
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  type: "",
  startDate: "",
  endDate: ""
});

const columns: TableColumnList = [
  {
    label: "类型",
    prop: "type",
    formatter: ({ type }) => (type === "income" ? "收入" : "支出")
  },
  {
    label: "金额",
    prop: "amount"
  },
  {
    label: "账户",
    prop: "paymentUid"
  },
  {
    label: "日期",
    prop: "date"
  },
  {
    label: "描述",
    prop: "desc"
  }
  // Operations would go here
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getOtherTransactionListApi(pagination.currentPage, {
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate
    });
    dataList.value = data.list;
    pagination.total = data.total ?? data.count;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const resetForm = (formEl?: FormInstance) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="!w-[180px]"
        >
          <el-option label="收入" value="income" />
          <el-option label="支出" value="expense" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围" prop="date">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
          class="!w-[180px]"
        />
        <span class="mx-2">-</span>
        <el-date-picker
          v-model="form.endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="!w-[180px]"
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

    <PureTableBar title="收支明细" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)">
          新增记录
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
          @page-size-change="onSearch"
          @page-current-change="onSearch"
        />
      </template>
    </PureTableBar>
  </div>
</template>

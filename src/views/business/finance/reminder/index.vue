<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getCollectionReminderListApi } from "@/api/finance";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Add from "~icons/ep/plus";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "FinanceReminder"
});

const loading = ref(true);
const dataList = ref([]);
const formRef = ref<FormInstance>();
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  status: ""
});

const columns: TableColumnList = [
  {
    label: "客户",
    prop: "customerUid" // Should ideally be name
  },
  {
    label: "金额",
    prop: "amount"
  },
  {
    label: "到期日",
    prop: "dueDate"
  },
  {
    label: "内容",
    prop: "content"
  },
  {
    label: "状态",
    prop: "status",
    formatter: ({ status }) => (status === "pending" ? "待处理" : "已处理")
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getCollectionReminderListApi(
      pagination.currentPage,
      { status: form.status }
    );
    dataList.value = data.list;
    pagination.total = data.total;
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
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="!w-[180px]"
        >
          <el-option label="待处理" value="pending" />
          <el-option label="已处理" value="processed" />
        </el-select>
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

    <PureTableBar title="催收提醒" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)">
          新增提醒
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

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { getOperationLogListApi } from "@/api/system/log";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "SystemLog"
});

const loading = ref(true);
const dataList = ref([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  module: "",
  method: "",
  operator: "",
  status: undefined as boolean | undefined
});

const columns: TableColumnList = [
  {
    label: "模块",
    prop: "module"
  },
  {
    label: "方法",
    prop: "method"
  },
  {
    label: "操作人",
    prop: "operator"
  },
  {
    label: "IP",
    prop: "ip"
  },
  {
    label: "耗时(ms)",
    prop: "duration"
  },
  {
    label: "状态",
    prop: "success",
    cellRenderer: ({ row }) =>
      h(
        "el-tag",
        { type: row.success ? "success" : "danger" },
        { default: () => (row.success ? "成功" : "失败") }
      )
  },
  {
    label: "时间",
    prop: "createdAt"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getOperationLogListApi(pagination.currentPage, {
      ...form
    });
    dataList.value = data.list;
    pagination.total = data.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const resetForm = formEl => {
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
      <el-form-item label="模块" prop="module">
        <el-input v-model="form.module" placeholder="请输入模块" clearable />
      </el-form-item>
      <el-form-item label="操作人" prop="operator">
        <el-input
          v-model="form.operator"
          placeholder="请输入操作人"
          clearable
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="!w-[180px]"
        >
          <el-option label="成功" :value="true" />
          <el-option label="失败" :value="false" />
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

    <PureTableBar title="操作日志" @refresh="onSearch">
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

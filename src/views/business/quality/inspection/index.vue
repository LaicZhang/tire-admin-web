<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  getInspectionRecordListApi,
  type InspectionRecord
} from "@/api/business/quality";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Add from "~icons/ep/plus";

defineOptions({
  name: "QualityInspection"
});

const loading = ref(true);
const dataList = ref<InspectionRecord[]>([]);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  purchaseOrderNo: "",
  startDate: "",
  endDate: ""
});

const columns: TableColumnList = [
  {
    label: "单号",
    prop: "id"
  },
  {
    label: "关联采购单",
    prop: "purchaseOrderId" // Should convert to NO ideally
  },
  {
    label: "质检员",
    prop: "inspectorId"
  },
  {
    label: "质检时间",
    prop: "createdAt"
  },
  {
    label: "备注",
    prop: "remark"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getInspectionRecordListApi(pagination.currentPage, {
      ...form
    });
    dataList.value = data.list;
    pagination.total = data.total ?? data.count ?? 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const onReset = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

onMounted(() => {
  onSearch();
});
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
      <el-form-item label="采购单号" prop="purchaseOrderNo">
        <el-input
          v-model="form.purchaseOrderNo"
          placeholder="请输入单号"
          clearable
        />
      </el-form-item>
      <el-form-item label="日期范围" prop="date">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
          class="w-[180px]"
        />
        <span class="mx-2">-</span>
        <el-date-picker
          v-model="form.endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="质检记录" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)">
          新增质检
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

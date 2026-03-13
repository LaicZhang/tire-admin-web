<script setup lang="ts">
import { h, reactive, ref } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { addDialog } from "@/components/ReDialog";
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { message } from "@/utils/message";
import Add from "~icons/ep/plus";
import {
  createQualityInspectionApi,
  getQualityInspectionListApi,
  type CreateQualityInspectionDto,
  type QualityInspectionRecord
} from "@/api/business/quality";
import { columns } from "./columns";
import QualityInspectionFormDialog from "./components/QualityInspectionFormDialog.vue";

defineOptions({
  name: "QualityInspection"
});

interface QualityInspectionFormExpose {
  validate: () => Promise<boolean>;
  getPayload: () => CreateQualityInspectionDto;
}

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const loading = ref(false);
const dataList = ref<QualityInspectionRecord[]>([]);
const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});
const form = reactive({
  purchaseOrderNo: undefined as string | undefined,
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined
});

async function fetchData() {
  loading.value = true;
  try {
    const { data, code, msg } = await getQualityInspectionListApi({
      page: pagination.value.currentPage,
      ...form
    });
    if (code !== 200) {
      message(msg || "加载质检记录失败", { type: "error" });
      return;
    }
    dataList.value = data.list ?? [];
    pagination.value.total = data.total ?? data.count ?? 0;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "加载质检记录失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.value.currentPage = 1;
  void fetchData();
}

function onReset() {
  searchFormRef.value?.resetFields();
  onSearch();
}

function handleCurrentChange(page: number) {
  pagination.value.currentPage = page;
  void fetchData();
}

function openCreateDialog() {
  const formRef = ref<QualityInspectionFormExpose | null>(null);
  addDialog({
    title: "新增质检",
    width: "680px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h(QualityInspectionFormDialog, {
        ref: formRef
      }),
    beforeSure: async done => {
      try {
        const valid = await formRef.value?.validate();
        if (!valid) return;

        const payload = formRef.value?.getPayload();
        if (!payload) return;

        await createQualityInspectionApi(payload);
        message("质检记录创建成功", { type: "success" });
        done();
        await fetchData();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "创建质检记录失败";
        message(msg, { type: "error" });
      }
    }
  });
}

void fetchData();
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

    <PureTableBar title="质检记录" @refresh="fetchData">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(Add)"
          @click="openCreateDialog"
        >
          新增质检
        </el-button>
      </template>
      <template v-slot="{ size }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="columns"
          :pagination="{ ...pagination, size }"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-current-change="handleCurrentChange"
        />
      </template>
    </PureTableBar>
  </div>
</template>

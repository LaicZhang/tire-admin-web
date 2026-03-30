<script setup lang="ts">
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { ref, h } from "vue";
import { columns, statusMap } from "./columns";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import StatusTag from "@/components/StatusTag/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import {
  getSerialNumberList,
  type SerialNumber
} from "@/api/business/serialNumber";
import { message } from "@/utils/message";
import { addDialog } from "@/composables/useDialogService";
import { deviceDetection } from "@pureadmin/utils";
import SerialNumberAddForm from "./SerialNumberAddForm.vue";
import SerialNumberLogsForm from "./SerialNumberLogsForm.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";
import { useOptionsByType } from "@/composables/useOptions";

defineOptions({
  name: "SerialNumberList"
});

const form = ref({
  tireId: undefined as string | undefined,
  repoId: undefined as string | undefined,
  keyword: undefined as string | undefined,
  status: undefined as string | undefined
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
type SerialNumberAddFormExpose = {
  handleSubmit: () => Promise<boolean>;
};
const addFormRef = ref<SerialNumberAddFormExpose | null>(null);

const { options: tireOptions } = useOptionsByType("tires");
const { options: repoOptions } = useOptionsByType("repos");

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  SerialNumber,
  CommonResult<{ count: number; list: SerialNumber[] }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getSerialNumberList({
      index: page,
      tireId: form.value.tireId || undefined,
      repoId: form.value.repoId || undefined,
      keyword: form.value.keyword || undefined,
      status: form.value.status || undefined
    }),
  pagination: {
    total: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    currentPage: 1,
    background: true
  },
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "加载失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.count ?? 0
    };
  },
  immediate: true
});

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

function onReset() {
  searchFormRef.value?.resetFields();
  onSearch();
}

function handleAdd(type: "single" | "batch") {
  addDialog({
    title: type === "single" ? "新增序列号" : "批量新增序列号",
    props: {
      formInline: {
        type,
        tireOptions: tireOptions.value,
        repoOptions: repoOptions.value
      }
    },
    width: "500px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(SerialNumberAddForm, {
        ref: addFormRef,
        formInline: (
          options.props as {
            formInline: {
              type: "single" | "batch";
              tireOptions: Array<{ uid: string; name: string }>;
              repoOptions: Array<{ uid: string; name: string }>;
            };
          }
        ).formInline
      }),
    beforeSure: async done => {
      const formInstance = addFormRef.value;
      if (!formInstance) return;
      const success = await formInstance.handleSubmit();
      if (success) {
        done();
        fetchData();
      }
    }
  });
}

function handleViewLogs(row: SerialNumber) {
  addDialog({
    title: `流转记录 - ${row.serialNo}`,
    props: {
      formInline: {
        serialNo: row.serialNo
      }
    },
    width: "700px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: true,
    hideFooter: true,
    contentRenderer: ({ options }) =>
      h(SerialNumberLogsForm, {
        formInline: (options.props as { formInline: { serialNo: string } })
          .formInline
      })
  });
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
      <el-form-item label="商品" prop="tireId">
        <el-select
          v-model="form.tireId"
          placeholder="请选择商品"
          clearable
          filterable
          class="w-[200px]"
        >
          <el-option
            v-for="item in tireOptions"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库" prop="repoId">
        <el-select
          v-model="form.repoId"
          placeholder="请选择仓库"
          clearable
          filterable
          class="w-[180px]"
        >
          <el-option
            v-for="item in repoOptions"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="序列号" prop="keyword">
        <el-input
          v-model="form.keyword"
          placeholder="请输入序列号"
          clearable
          class="w-[200px]"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="w-[140px]"
        >
          <el-option label="在库" value="IN_STOCK" />
          <el-option label="已占用" value="RESERVED" />
          <el-option label="在途" value="IN_TRANSIT" />
          <el-option label="已出库" value="OUTBOUND" />
          <el-option label="已安装" value="INSTALLED" />
          <el-option label="已售" value="SOLD" />
          <el-option label="退回待检" value="RETURNED_PENDING_QC" />
          <el-option label="良品退回" value="GOOD_RETURN" />
          <el-option label="不良" value="DEFECTIVE" />
          <el-option label="已报废" value="SCRAPPED" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="轮胎序列号管理" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd('single')"
        >
          新增序列号
        </el-button>
        <el-button type="success" @click="handleAdd('batch')">
          批量新增
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
            <StatusTag :status="row.status" :status-map="statusMap" />
          </template>
          <template #operation="{ row, size }">
            <el-button
              link
              type="primary"
              :size="size"
              @click="handleViewLogs(row)"
            >
              流转记录
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

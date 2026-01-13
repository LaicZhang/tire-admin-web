<script setup lang="ts">
import { ref, reactive, h } from "vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import {
  getSerialNumberList,
  type SerialNumber
} from "@/api/business/serialNumber";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import SerialNumberAddForm from "./SerialNumberAddForm.vue";
import SerialNumberLogsForm from "./SerialNumberLogsForm.vue";

defineOptions({
  name: "SerialNumberList"
});

const form = ref({
  keyword: "",
  status: ""
});

const dataList = ref<SerialNumber[]>([]);
const loading = ref(true);
const pagination = ref({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

const addFormRef = ref();

// Mock 商品和仓库数据（实际接口获取）
const tireOptions = ref<Array<{ uid: string; name: string }>>([]);
const repoOptions = ref<Array<{ uid: string; name: string }>>([]);

const columns: TableColumnList = [
  {
    label: "序列号",
    prop: "serialNo",
    minWidth: 180
  },
  {
    label: "商品",
    prop: "tire",
    minWidth: 150,
    formatter: ({ tire }) => tire?.name || "-"
  },
  {
    label: "仓库",
    prop: "repo",
    minWidth: 120,
    formatter: ({ repo }) => repo?.name || "-"
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "批次号",
    prop: "batchNo",
    minWidth: 120
  },
  {
    label: "创建时间",
    prop: "createdAt",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 150,
    slot: "operation"
  }
];

const statusMap: Record<string, { label: string; type: string }> = {
  IN_STOCK: { label: "在库", type: "success" },
  SOLD: { label: "已售", type: "info" },
  RETURNED: { label: "已退", type: "warning" },
  SCRAPPED: { label: "已报废", type: "danger" }
};

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getSerialNumberList({
      index: pagination.value.currentPage,
      keyword: form.value.keyword || undefined,
      status: form.value.status || undefined
    });
    dataList.value = data.list;
    pagination.value.total = data.count;
  } catch (e: unknown) {
    const error = e as Error;
    message(error.message, { type: "error" });
  } finally {
    loading.value = false;
  }
}

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

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
    contentRenderer: () => h(SerialNumberAddForm, { ref: addFormRef }),
    beforeSure: async done => {
      const formInstance = addFormRef.value;
      if (!formInstance) return;
      const success = await formInstance.handleSubmit();
      if (success) {
        done();
        onSearch();
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
    contentRenderer: () => h(SerialNumberLogsForm)
  });
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
          <el-option label="已售" value="SOLD" />
          <el-option label="已退" value="RETURNED" />
          <el-option label="已报废" value="SCRAPPED" />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="序列号管理" :columns="columns" @refresh="onSearch">
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
            <el-tag
              :type="
                (statusMap[row.status]?.type as
                  | 'success'
                  | 'info'
                  | 'warning'
                  | 'danger') || 'info'
              "
            >
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
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

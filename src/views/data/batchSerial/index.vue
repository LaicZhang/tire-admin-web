<script setup lang="ts">
import { ref, h, onMounted, computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import type { Batch, SerialNumber, BatchForm, SerialNumberForm } from "./types";
import type { FormInstance } from "element-plus";
import {
  getSerialNumberList,
  createSerialNumber,
  createSerialNumberBatch
} from "@/api/business/serialNumber";
import { getBatchListApi, createBatchApi } from "@/api/batch";

defineOptions({
  name: "BatchSerial"
});

const activeTab = ref("batch");
const loading = ref(false);
const formRef = ref();

// 批次相关
const batchList = ref<Batch[]>([]);
const batchForm = ref({
  tireId: undefined,
  repoId: undefined,
  batchNo: undefined
});
const batchPagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 序列号相关
const serialList = ref<SerialNumber[]>([]);
const serialForm = ref({
  tireId: undefined,
  repoId: undefined,
  status: undefined,
  keyword: undefined
});
const serialPagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const batchColumns = [
  { label: "ID", prop: "id", width: 80 },
  { label: "批次号", prop: "batchNo", width: 150 },
  { label: "商品名称", prop: "tireName" },
  { label: "仓库", prop: "repoName" },
  { label: "数量", prop: "quantity", width: 100 },
  { label: "生产日期", prop: "productionDate", width: 120 },
  { label: "到期日期", prop: "expiryDate", width: 120 },
  { label: "状态", prop: "status", slot: "status", width: 100 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 120
  }
];

const serialColumns = [
  { label: "ID", prop: "id", width: 80 },
  { label: "序列号", prop: "serialNo", width: 180 },
  { label: "商品", prop: "tire.name" },
  { label: "仓库", prop: "repo.name" },
  { label: "状态", prop: "status", slot: "serialStatus", width: 100 },
  { label: "批次号", prop: "batchNo", width: 120 },
  { label: "生产日期", prop: "productionDate", width: 120 },
  { label: "到期日期", prop: "expiryDate", width: 120 },
  { label: "创建时间", prop: "createdAt", width: 160 },
  {
    label: "操作",
    prop: "operation",
    slot: "serialOperation",
    fixed: "right",
    minWidth: 100
  }
];

const statusOptions = [
  { label: "在库", value: "IN_STOCK" },
  { label: "已售", value: "SOLD" },
  { label: "退货", value: "RETURNED" },
  { label: "报废", value: "SCRAPPED" }
];

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    IN_STOCK: "success",
    SOLD: "info",
    RETURNED: "warning",
    SCRAPPED: "danger"
  };
  return map[status] || "info";
};

const getStatusLabel = (status: string) => {
  const item = statusOptions.find(s => s.value === status);
  return item?.label || status;
};

const expiryColumns: TableColumnList = [
  { label: "批次号", prop: "batchNo" },
  { label: "商品名称", prop: "tireName" },
  { label: "仓库", prop: "repoName" },
  { label: "数量", prop: "quantity" },
  { label: "到期日期", prop: "expiryDate" },
  { label: "剩余天数", slot: "remainingDays" }
];

// 模拟批次数据
const mockBatchData: Batch[] = [
  {
    id: 1,
    uid: "b1",
    batchNo: "BATCH-2024-001",
    tireId: "t1",
    tireName: "轮胎A",
    repoId: "r1",
    repoName: "主仓库",
    quantity: 100,
    productionDate: "2024-01-01",
    expiryDate: "2025-01-01",
    createdAt: "2024-01-01 10:00:00"
  },
  {
    id: 2,
    uid: "b2",
    batchNo: "BATCH-2024-002",
    tireId: "t2",
    tireName: "轮胎B",
    repoId: "r1",
    repoName: "主仓库",
    quantity: 50,
    productionDate: "2024-02-01",
    expiryDate: "2025-02-01",
    createdAt: "2024-02-01 10:00:00"
  }
];

// 模拟序列号数据
const mockSerialData: SerialNumber[] = [
  {
    id: 1,
    uid: "s1",
    serialNo: "SN-2024-00001",
    tireId: "t1",
    repoId: "r1",
    status: "IN_STOCK",
    batchNo: "BATCH-2024-001",
    productionDate: "2024-01-01",
    expiryDate: "2025-01-01",
    createdAt: "2024-01-01 10:00:00",
    tire: { name: "轮胎A" },
    repo: { name: "主仓库" }
  },
  {
    id: 2,
    uid: "s2",
    serialNo: "SN-2024-00002",
    tireId: "t1",
    repoId: "r1",
    status: "SOLD",
    batchNo: "BATCH-2024-001",
    productionDate: "2024-01-01",
    expiryDate: "2025-01-01",
    createdAt: "2024-01-01 10:00:00",
    tire: { name: "轮胎A" },
    repo: { name: "主仓库" }
  }
];

const getBatchList = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300));
    batchList.value = mockBatchData;
    batchPagination.value.total = mockBatchData.length;
  } finally {
    loading.value = false;
  }
};

const getSerialList = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300));
    serialList.value = mockSerialData;
    serialPagination.value.total = mockSerialData.length;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  if (activeTab.value === "batch") {
    batchPagination.value.currentPage = 1;
    getBatchList();
  } else {
    serialPagination.value.currentPage = 1;
    getSerialList();
  }
};

const resetForm = (formEl: any) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

const handleBatchPageChange = (val: number) => {
  batchPagination.value.currentPage = val;
  getBatchList();
};

const handleSerialPageChange = (val: number) => {
  serialPagination.value.currentPage = val;
  getSerialList();
};

const dialogFormRef = ref<{ getRef: () => FormInstance } | null>(null);

const openBatchDialog = (title = "新增", row?: Batch) => {
  addDialog({
    title: `${title}批次`,
    props: {
      formInline: {
        id: row?.id,
        uid: row?.uid,
        batchNo: row?.batchNo ?? "",
        tireId: row?.tireId ?? "",
        repoId: row?.repoId ?? "",
        quantity: row?.quantity ?? 0,
        productionDate: row?.productionDate,
        expiryDate: row?.expiryDate
      }
    },
    width: "500px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(editForm, {
        ref: dialogFormRef,
        formInline: (options.props as { formInline: BatchForm }).formInline
      }),
    beforeSure: (done, { options }) => {
      const FormRef = dialogFormRef.value?.getRef();
      if (!FormRef) return;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          message(`${title}成功`, { type: "success" });
          done();
          getBatchList();
        }
      });
    }
  });
};

const openSerialDialog = () => {
  addDialog({
    title: "新增序列号",
    width: "600px",
    draggable: true,
    fullscreen: deviceDetection(),
    closeOnClickModal: false,
    contentRenderer: () =>
      h("div", { class: "p-4" }, [
        h("el-alert", {
          title: "批量生成序列号",
          type: "info",
          description: "可通过设置前缀、起始编号和数量批量生成序列号",
          showIcon: true,
          closable: false
        })
      ]),
    beforeSure: done => {
      message("序列号创建成功", { type: "success" });
      done();
      getSerialList();
    }
  });
};

const handleDeleteBatch = async (row: Batch) => {
  message(`删除批次${row.batchNo}成功`, { type: "success" });
  getBatchList();
};

const handleViewSerial = (row: SerialNumber) => {
  addDialog({
    title: `序列号详情 - ${row.serialNo}`,
    width: "600px",
    hideFooter: true,
    contentRenderer: () =>
      h("div", { class: "p-4" }, [
        h("el-descriptions", { column: 2, border: true }, [
          h("el-descriptions-item", { label: "序列号" }, row.serialNo),
          h(
            "el-descriptions-item",
            { label: "状态" },
            getStatusLabel(row.status)
          ),
          h("el-descriptions-item", { label: "商品" }, row.tire?.name),
          h("el-descriptions-item", { label: "仓库" }, row.repo?.name),
          h("el-descriptions-item", { label: "批次号" }, row.batchNo || "-"),
          h(
            "el-descriptions-item",
            { label: "生产日期" },
            row.productionDate || "-"
          ),
          h(
            "el-descriptions-item",
            { label: "到期日期" },
            row.expiryDate || "-"
          ),
          h("el-descriptions-item", { label: "创建时间" }, row.createdAt)
        ])
      ])
  });
};

// 计算即将过期的批次
const expiringBatches = computed(() => {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return batchList.value.filter(batch => {
    if (!batch.expiryDate) return false;
    const expiry = new Date(batch.expiryDate);
    return expiry <= thirtyDaysLater && expiry > now;
  });
});

const handleTabChange = (tab: string) => {
  if (tab === "batch") {
    getBatchList();
  } else {
    getSerialList();
  }
};

onMounted(() => {
  getBatchList();
  getSerialList();
});
</script>

<template>
  <div class="main">
    <!-- 过期预警 -->
    <el-card v-if="expiringBatches.length > 0" class="m-1">
      <el-alert type="warning" :closable="false" show-icon>
        <template #title>
          <span class="font-bold">保质期预警</span>
        </template>
        <template #default>
          <span
            >有
            {{ expiringBatches.length }}
            个批次将在30天内到期，请及时处理。</span
          >
        </template>
      </el-alert>
    </el-card>

    <el-card class="m-1">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 批次管理 -->
        <el-tab-pane label="批次管理" name="batch">
          <el-form
            ref="formRef"
            :inline="true"
            :model="batchForm"
            class="search-form mb-4"
          >
            <el-form-item label="商品：" prop="tireId">
              <el-input
                v-model="batchForm.tireId"
                placeholder="请输入商品"
                clearable
                class="w-[160px]!"
              />
            </el-form-item>
            <el-form-item label="批次号：" prop="batchNo">
              <el-input
                v-model="batchForm.batchNo"
                placeholder="请输入批次号"
                clearable
                class="w-[160px]!"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :icon="useRenderIcon('ri:search-line')"
                :loading="loading"
                @click="onSearch"
              >
                搜索
              </el-button>
              <el-button
                :icon="useRenderIcon(Refresh)"
                @click="resetForm(formRef)"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>

          <PureTableBar title="批次列表" @refresh="getBatchList">
            <template #buttons>
              <el-button
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="openBatchDialog()"
              >
                新增批次
              </el-button>
            </template>
            <template v-slot="{ size }">
              <pure-table
                row-key="uid"
                adaptive
                :size
                :columns="batchColumns"
                border
                :data="batchList"
                :loading="loading"
                showOverflowTooltip
                :pagination="{ ...batchPagination, size }"
                @page-current-change="handleBatchPageChange"
              >
                <template #status="{ row }">
                  <el-tag
                    v-if="row.expiryDate"
                    :type="
                      new Date(row.expiryDate) < new Date()
                        ? 'danger'
                        : 'success'
                    "
                  >
                    {{
                      new Date(row.expiryDate) < new Date() ? "已过期" : "正常"
                    }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
                <template #operation="{ row }">
                  <el-button
                    link
                    type="primary"
                    @click="openBatchDialog('编辑', row)"
                  >
                    编辑
                  </el-button>
                  <el-popconfirm
                    :title="`确认删除批次${row.batchNo}?`"
                    @confirm="handleDeleteBatch(row)"
                  >
                    <template #reference>
                      <el-button link type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </el-tab-pane>

        <!-- 序列号管理 -->
        <el-tab-pane label="序列号管理" name="serial">
          <el-form :inline="true" :model="serialForm" class="search-form mb-4">
            <el-form-item label="商品：" prop="tireId">
              <el-input
                v-model="serialForm.tireId"
                placeholder="请输入商品"
                clearable
                class="w-[160px]!"
              />
            </el-form-item>
            <el-form-item label="状态：" prop="status">
              <el-select
                v-model="serialForm.status"
                placeholder="请选择状态"
                clearable
                class="w-[120px]!"
              >
                <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="序列号：" prop="keyword">
              <el-input
                v-model="serialForm.keyword"
                placeholder="请输入序列号"
                clearable
                class="w-[160px]!"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :icon="useRenderIcon('ri:search-line')"
                :loading="loading"
                @click="onSearch"
              >
                搜索
              </el-button>
              <el-button
                :icon="useRenderIcon(Refresh)"
                @click="resetForm(formRef)"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>

          <PureTableBar title="序列号列表" @refresh="getSerialList">
            <template #buttons>
              <el-button
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="openSerialDialog()"
              >
                新增序列号
              </el-button>
            </template>
            <template v-slot="{ size }">
              <pure-table
                row-key="uid"
                adaptive
                :size
                :columns="serialColumns"
                border
                :data="serialList"
                :loading="loading"
                showOverflowTooltip
                :pagination="{ ...serialPagination, size }"
                @page-current-change="handleSerialPageChange"
              >
                <template #serialStatus="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
                <template #serialOperation="{ row }">
                  <el-button link type="primary" @click="handleViewSerial(row)">
                    查看
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </el-tab-pane>

        <!-- 保质期预警 -->
        <el-tab-pane label="保质期预警" name="expiry">
          <el-empty
            v-if="expiringBatches.length === 0"
            description="暂无即将过期的批次"
          />
          <pure-table
            v-else
            :data="expiringBatches"
            border
            :columns="expiryColumns"
          >
            <template #remainingDays="{ row }">
              <span class="text-red-500 font-bold">
                {{
                  Math.ceil(
                    (new Date(row.expiryDate).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                }}
                天
              </span>
            </template>
          </pure-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

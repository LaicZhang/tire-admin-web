<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, h, computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import StatusTag from "@/components/StatusTag/index.vue";
import DeleteButton from "@/components/DeleteButton/index.vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import type { BatchForm } from "./types";
import {
  getBatchListApi,
  createBatchApi,
  updateBatchApi,
  deleteBatchApi,
  type Batch
} from "@/api/batch";
import {
  getSerialNumberList,
  type SerialNumber
} from "@/api/business/serialNumber";
import type { FormInstance, TabPaneName } from "element-plus";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";
import { useOptionsByType } from "@/composables/useOptions";

defineOptions({
  name: "BatchSerial"
});

const activeTab = ref("batch");
const batchSearchFormRef = ref<InstanceType<typeof ReSearchForm>>();
const serialSearchFormRef = ref<InstanceType<typeof ReSearchForm>>();

const { options: tireOptions } = useOptionsByType("tires");

// 批次相关
const batchForm = ref({
  tireId: undefined,
  repoId: undefined,
  batchNo: undefined
});

// 序列号相关
const serialForm = ref({
  tireId: undefined,
  repoId: undefined,
  status: undefined,
  keyword: undefined
});

const {
  loading: batchLoading,
  dataList: batchList,
  pagination: batchPagination,
  fetchData: getBatchList,
  onCurrentChange: onBatchPageChange
} = useCrud<Batch, CommonResult<Batch[]>, { page: number; pageSize: number }>({
  api: () =>
    getBatchListApi({
      tireId: batchForm.value.tireId,
      repoId: batchForm.value.repoId,
      batchNo: batchForm.value.batchNo
    }),
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  },
  transform: (res: CommonResult<Batch[]>) => {
    if (res.code !== 0) {
      message(res.msg || "获取批次列表失败", { type: "error" });
      return { list: [], total: 0 };
    }
    const list = res.data ?? [];
    return { list, total: list.length };
  },
  immediate: true
});

const {
  loading: serialLoading,
  dataList: serialList,
  pagination: serialPagination,
  fetchData: getSerialList,
  onCurrentChange: onSerialPageChange
} = useCrud<
  SerialNumber,
  CommonResult<{ count: number; list: SerialNumber[] }>,
  { page: number; pageSize: number }
>({
  api: () =>
    getSerialNumberList({
      tireId: serialForm.value.tireId,
      repoId: serialForm.value.repoId,
      status: serialForm.value.status,
      keyword: serialForm.value.keyword
    }),
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  },
  transform: (res: CommonResult<{ count: number; list: SerialNumber[] }>) => {
    if (res.code !== 0) {
      message(res.msg || "获取序列号列表失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return { list: res.data?.list ?? [], total: res.data?.count ?? 0 };
  },
  immediate: true
});

const loading = computed(() => batchLoading.value || serialLoading.value);

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

const serialStatusMap = {
  IN_STOCK: { label: "在库", type: "success" },
  SOLD: { label: "已售", type: "info" },
  RETURNED: { label: "退货", type: "warning" },
  SCRAPPED: { label: "报废", type: "danger" }
} as const;

const batchExpiryStatusMap = {
  1: { label: "正常", type: "success" },
  0: { label: "已过期", type: "danger" }
} as const;

const getBatchExpiryStatus = (expiryDate: string) =>
  new Date(expiryDate) < new Date() ? 0 : 1;

const expiryColumns: TableColumnList = [
  { label: "批次号", prop: "batchNo" },
  { label: "商品名称", prop: "tireName" },
  { label: "仓库", prop: "repoName" },
  { label: "数量", prop: "quantity" },
  { label: "到期日期", prop: "expiryDate" },
  { label: "剩余天数", slot: "remainingDays" }
];

const onBatchSearch = () => {
  batchPagination.value = { ...batchPagination.value, currentPage: 1 };
  getBatchList();
};

const onSerialSearch = () => {
  serialPagination.value = { ...serialPagination.value, currentPage: 1 };
  getSerialList();
};

const onBatchReset = () => {
  batchSearchFormRef.value?.resetFields();
  onBatchSearch();
};

const onSerialReset = () => {
  serialSearchFormRef.value?.resetFields();
  onSerialSearch();
};

const handleBatchPageChange = (val: number) => onBatchPageChange(val);

const handleSerialPageChange = (val: number) => onSerialPageChange(val);

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
          const formData = (options.props as { formInline: BatchForm })
            .formInline;
          try {
            if (formData.id) {
              // 编辑
              const { data, code } = await updateBatchApi(formData.id, {
                batchNo: formData.batchNo,
                quantity: formData.quantity,
                productionDate: formData.productionDate,
                expiryDate: formData.expiryDate
              });
              if (code === 0) {
                message(`${title}成功`, { type: "success" });
                done();
                getBatchList();
              }
            } else {
              // 新增
              const { data, code } = await createBatchApi({
                repoId: formData.repoId,
                tireId: formData.tireId,
                batchNo: formData.batchNo,
                quantity: formData.quantity,
                productionDate: formData.productionDate,
                expiryDate: formData.expiryDate
              });
              if (code === 0) {
                message(`${title}成功`, { type: "success" });
                done();
                getBatchList();
              }
            }
          } catch (error) {
            message(`${title}失败`, { type: "error" });
          }
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
  try {
    const { data, code } = await deleteBatchApi(row.id);
    if (code === 0) {
      message(`删除批次${row.batchNo}成功`, { type: "success" });
      getBatchList();
    }
  } catch (error) {
    message(`删除批次失败`, { type: "error" });
  }
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
            serialStatusMap[row.status]?.label || row.status
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

const handleTabChange = (tab: TabPaneName) => {
  if (tab === "batch") {
    getBatchList();
  } else {
    getSerialList();
  }
};
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
          <ReSearchForm
            ref="batchSearchFormRef"
            shadow="never"
            :form="batchForm"
            :loading="loading"
            :body-style="{ padding: '16px 16px 0' }"
            @search="onBatchSearch"
            @reset="onBatchReset"
          >
            <el-form-item label="商品：" prop="tireId">
              <el-select
                v-model="batchForm.tireId"
                placeholder="请选择商品"
                filterable
                clearable
                class="w-[160px]!"
              >
                <el-option
                  v-for="item in tireOptions"
                  :key="item.uid"
                  :label="item.name"
                  :value="item.uid"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="批次号：" prop="batchNo">
              <el-input
                v-model="batchForm.batchNo"
                placeholder="请输入批次号"
                clearable
                class="w-[160px]!"
              />
            </el-form-item>
          </ReSearchForm>

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
                  <StatusTag
                    v-if="row.expiryDate"
                    :status="getBatchExpiryStatus(row.expiryDate)"
                    :status-map="batchExpiryStatusMap"
                    size="default"
                  />
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
                  <DeleteButton
                    :show-icon="false"
                    :title="`确认删除批次${row.batchNo}?`"
                    @confirm="handleDeleteBatch(row)"
                  />
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </el-tab-pane>

        <!-- 序列号管理 -->
        <el-tab-pane label="序列号管理" name="serial">
          <ReSearchForm
            ref="serialSearchFormRef"
            shadow="never"
            :form="serialForm"
            :loading="loading"
            :body-style="{ padding: '16px 16px 0' }"
            @search="onSerialSearch"
            @reset="onSerialReset"
          >
            <el-form-item label="商品：" prop="tireId">
              <el-select
                v-model="serialForm.tireId"
                placeholder="请选择商品"
                filterable
                clearable
                class="w-[160px]!"
              >
                <el-option
                  v-for="item in tireOptions"
                  :key="item.uid"
                  :label="item.name"
                  :value="item.uid"
                />
              </el-select>
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
          </ReSearchForm>

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
                  <StatusTag
                    :status="row.status"
                    :status-map="serialStatusMap"
                    size="default"
                  />
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

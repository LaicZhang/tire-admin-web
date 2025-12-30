<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import {
  getSerialNumberList,
  getSerialNumberLogs,
  createSerialNumber,
  createSerialNumberBatch,
  type SerialNumber,
  type SerialNumberLog
} from "@/api/business/serialNumber";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";

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

// 新建弹窗
const dialogVisible = ref(false);
const dialogType = ref<"single" | "batch">("single");
const formLoading = ref(false);

const formData = reactive({
  serialNo: "",
  serialNos: "",
  tireId: "",
  repoId: "",
  batchNo: "",
  productionDate: "",
  expiryDate: ""
});

// 流转记录弹窗
const logsDialogVisible = ref(false);
const logsList = ref<SerialNumberLog[]>([]);
const logsLoading = ref(false);
const currentSerialNo = ref("");

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

function resetForm(formEl: { resetFields: () => void } | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
}

const formRef = ref();

function handleAdd(type: "single" | "batch") {
  dialogType.value = type;
  Object.assign(formData, {
    serialNo: "",
    serialNos: "",
    tireId: "",
    repoId: "",
    batchNo: "",
    productionDate: "",
    expiryDate: ""
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formData.tireId) {
    message("请选择商品", { type: "warning" });
    return;
  }
  if (!formData.repoId) {
    message("请选择仓库", { type: "warning" });
    return;
  }

  formLoading.value = true;
  try {
    if (dialogType.value === "single") {
      if (!formData.serialNo) {
        message("请输入序列号", { type: "warning" });
        formLoading.value = false;
        return;
      }
      await createSerialNumber({
        serialNo: formData.serialNo,
        tireId: formData.tireId,
        repoId: formData.repoId,
        batchNo: formData.batchNo || undefined,
        productionDate: formData.productionDate || undefined,
        expiryDate: formData.expiryDate || undefined
      });
      message("创建成功", { type: "success" });
    } else {
      if (!formData.serialNos) {
        message("请输入序列号（每行一个）", { type: "warning" });
        formLoading.value = false;
        return;
      }
      const serialNos = formData.serialNos
        .split("\n")
        .map(s => s.trim())
        .filter(s => s);
      if (serialNos.length === 0) {
        message("请输入有效的序列号", { type: "warning" });
        formLoading.value = false;
        return;
      }
      const { data } = await createSerialNumberBatch({
        serialNos,
        tireId: formData.tireId,
        repoId: formData.repoId
      });
      const successCount = data.filter(r => r.success).length;
      const failCount = data.filter(r => !r.success).length;
      if (failCount > 0) {
        ElMessageBox.alert(
          `成功 ${successCount} 条，失败 ${failCount} 条。\n失败详情：${data
            .filter(r => !r.success)
            .map(r => `${r.serialNo}: ${r.error}`)
            .join("\n")}`,
          "批量创建结果",
          { type: "warning" }
        );
      } else {
        message(`批量创建成功 ${successCount} 条`, { type: "success" });
      }
    }
    dialogVisible.value = false;
    onSearch();
  } catch (e: unknown) {
    const error = e as Error;
    message(error.message, { type: "error" });
  } finally {
    formLoading.value = false;
  }
}

async function handleViewLogs(row: SerialNumber) {
  currentSerialNo.value = row.serialNo;
  logsDialogVisible.value = true;
  logsLoading.value = true;
  try {
    const { data } = await getSerialNumberLogs(row.serialNo);
    logsList.value = data;
  } catch (e: unknown) {
    const error = e as Error;
    message(error.message, { type: "error" });
  } finally {
    logsLoading.value = false;
  }
}

const actionMap: Record<string, string> = {
  IN: "入库",
  OUT: "出库",
  TRANSFER: "调拨",
  ADJUST: "调整"
};

const logColumns: TableColumnList = [
  { label: "操作", prop: "action", width: 100, slot: "action" },
  {
    label: "来源仓库",
    prop: "fromRepoId",
    minWidth: 120,
    formatter: row => row.fromRepoId || "-"
  },
  {
    label: "目标仓库",
    prop: "toRepoId",
    minWidth: 120,
    formatter: row => row.toRepoId || "-"
  },
  {
    label: "单据类型",
    prop: "orderType",
    width: 100,
    formatter: row => row.orderType || "-"
  },
  { label: "时间", prop: "createdAt", width: 160 }
];

onSearch();
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="序列号" prop="keyword">
        <el-input
          v-model="form.keyword"
          placeholder="请输入序列号"
          clearable
          class="w-[200px]!"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="w-[140px]!"
        >
          <el-option label="在库" value="IN_STOCK" />
          <el-option label="已售" value="SOLD" />
          <el-option label="已退" value="RETURNED" />
          <el-option label="已报废" value="SCRAPPED" />
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

    <!-- 新增弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'single' ? '新增序列号' : '批量新增序列号'"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item v-if="dialogType === 'single'" label="序列号" required>
          <el-input
            v-model="formData.serialNo"
            placeholder="请输入序列号（如：SN20241226001）"
          />
        </el-form-item>
        <el-form-item v-if="dialogType === 'batch'" label="序列号列表" required>
          <el-input
            v-model="formData.serialNos"
            type="textarea"
            :rows="6"
            placeholder="每行输入一个序列号"
          />
        </el-form-item>
        <el-form-item label="商品" required>
          <el-select
            v-model="formData.tireId"
            placeholder="请选择商品"
            class="w-full!"
            filterable
          >
            <el-option
              v-for="item in tireOptions"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
          <div class="text-xs text-gray-400 mt-1">
            提示：商品数据需从商品管理模块获取
          </div>
        </el-form-item>
        <el-form-item label="仓库" required>
          <el-select
            v-model="formData.repoId"
            placeholder="请选择仓库"
            class="w-full!"
            filterable
          >
            <el-option
              v-for="item in repoOptions"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
          <div class="text-xs text-gray-400 mt-1">
            提示：仓库数据需从仓库管理模块获取
          </div>
        </el-form-item>
        <el-form-item v-if="dialogType === 'single'" label="批次号">
          <el-input v-model="formData.batchNo" placeholder="可选" />
        </el-form-item>
        <el-form-item v-if="dialogType === 'single'" label="生产日期">
          <el-date-picker
            v-model="formData.productionDate"
            type="date"
            placeholder="选择日期"
            class="w-full!"
          />
        </el-form-item>
        <el-form-item v-if="dialogType === 'single'" label="有效期">
          <el-date-picker
            v-model="formData.expiryDate"
            type="date"
            placeholder="选择日期"
            class="w-full!"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 流转记录弹窗 -->
    <el-dialog
      v-model="logsDialogVisible"
      :title="`流转记录 - ${currentSerialNo}`"
      width="700px"
    >
      <pure-table
        :loading="logsLoading"
        :data="logsList"
        border
        :columns="logColumns"
      >
        <template #action="{ row }">
          {{ actionMap[row.action] || row.action }}
        </template>
      </pure-table>
    </el-dialog>
  </div>
</template>

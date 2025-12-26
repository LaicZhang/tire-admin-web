<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import {
  getWriteOffList,
  createWriteOff,
  approveWriteOff,
  rejectWriteOff,
  deleteWriteOff,
  type WriteOffOrder,
  type WriteOffOrderDto
} from "@/api/business/writeOff";
import { getCustomerListApi } from "@/api/business/customer";
import { getProviderListApi } from "@/api/business/provider";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";

defineOptions({
  name: "WriteOffList"
});

const form = ref({
  type: "",
  isApproved: ""
});

const dataList = ref<WriteOffOrder[]>([]);
const loading = ref(true);
const pagination = ref({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

// 弹窗相关
const dialogVisible = ref(false);
const dialogTitle = ref("新建核销单");
const formLoading = ref(false);
const customerList = ref<Array<{ uid: string; name: string }>>([]);
const providerList = ref<Array<{ uid: string; name: string }>>([]);

const formData = reactive<WriteOffOrderDto>({
  type: "OFFSET",
  customerId: "",
  providerId: "",
  receivableAmount: 0,
  payableAmount: 0,
  writeOffAmount: 0,
  reason: "",
  remark: ""
});

const columns: TableColumnList = [
  {
    label: "核销单号",
    prop: "uid",
    minWidth: 180
  },
  {
    label: "核销类型",
    prop: "type",
    minWidth: 100,
    formatter: ({ type }) => (type === "OFFSET" ? "互抵核销" : "坏账核销")
  },
  {
    label: "客户",
    prop: "customer",
    minWidth: 120,
    formatter: ({ customer }) => customer?.name || "-"
  },
  {
    label: "供应商",
    prop: "provider",
    minWidth: 120,
    formatter: ({ provider }) => provider?.name || "-"
  },
  {
    label: "应收金额",
    prop: "receivableAmount",
    minWidth: 110,
    formatter: ({ receivableAmount }) =>
      `¥${(receivableAmount / 100).toFixed(2)}`
  },
  {
    label: "应付金额",
    prop: "payableAmount",
    minWidth: 110,
    formatter: ({ payableAmount }) => `¥${(payableAmount / 100).toFixed(2)}`
  },
  {
    label: "核销金额",
    prop: "writeOffAmount",
    minWidth: 110,
    formatter: ({ writeOffAmount }) => `¥${(writeOffAmount / 100).toFixed(2)}`
  },
  {
    label: "审核状态",
    prop: "isApproved",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "createAt",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 200,
    slot: "operation"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getWriteOffList({
      index: pagination.value.currentPage,
      type: form.value.type || undefined,
      isApproved: form.value.isApproved || undefined
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

async function loadSelectData() {
  try {
    const [customerRes, providerRes] = await Promise.all([
      getCustomerListApi(1, { keyword: "" }),
      getProviderListApi(1, { keyword: "" })
    ]);
    customerList.value = customerRes.data?.list || [];
    providerList.value = providerRes.data?.list || [];
  } catch (e: unknown) {
    const error = e as Error;
    message(error.message, { type: "error" });
  }
}

function handleAdd() {
  dialogTitle.value = "新建核销单";
  Object.assign(formData, {
    type: "OFFSET",
    customerId: "",
    providerId: "",
    receivableAmount: 0,
    payableAmount: 0,
    writeOffAmount: 0,
    reason: "",
    remark: ""
  });
  loadSelectData();
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formData.customerId && !formData.providerId) {
    message("请选择客户或供应商", { type: "warning" });
    return;
  }
  if (formData.writeOffAmount <= 0) {
    message("核销金额必须大于0", { type: "warning" });
    return;
  }

  formLoading.value = true;
  try {
    await createWriteOff({
      ...formData,
      receivableAmount: Math.round(formData.receivableAmount * 100),
      payableAmount: Math.round(formData.payableAmount * 100),
      writeOffAmount: Math.round(formData.writeOffAmount * 100)
    });
    message("创建成功", { type: "success" });
    dialogVisible.value = false;
    onSearch();
  } catch (e: unknown) {
    const error = e as Error;
    message(error.message, { type: "error" });
  } finally {
    formLoading.value = false;
  }
}

async function handleApprove(row: WriteOffOrder) {
  try {
    await ElMessageBox.confirm("确定审核通过该核销单吗？", "提示", {
      type: "warning"
    });
    await approveWriteOff(row.uid);
    message("审核成功", { type: "success" });
    onSearch();
  } catch (e: unknown) {
    if ((e as string) !== "cancel") {
      const error = e as Error;
      message(error.message, { type: "error" });
    }
  }
}

async function handleReject(row: WriteOffOrder) {
  try {
    await ElMessageBox.confirm("确定拒绝该核销单吗？", "提示", {
      type: "warning"
    });
    await rejectWriteOff(row.uid);
    message("已拒绝", { type: "success" });
    onSearch();
  } catch (e: unknown) {
    if ((e as string) !== "cancel") {
      const error = e as Error;
      message(error.message, { type: "error" });
    }
  }
}

async function handleDelete(row: WriteOffOrder) {
  try {
    await ElMessageBox.confirm("确定删除该核销单吗？", "提示", {
      type: "warning"
    });
    await deleteWriteOff(row.uid);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e: unknown) {
    if ((e as string) !== "cancel") {
      const error = e as Error;
      message(error.message, { type: "error" });
    }
  }
}

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
      <el-form-item label="核销类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[160px]!"
        >
          <el-option label="互抵核销" value="OFFSET" />
          <el-option label="坏账核销" value="BAD_DEBT" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态" prop="isApproved">
        <el-select
          v-model="form.isApproved"
          placeholder="请选择状态"
          clearable
          class="w-[160px]!"
        >
          <el-option label="待审核" value="false" />
          <el-option label="已审核" value="true" />
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

    <PureTableBar title="核销单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建核销单
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
            <el-tag :type="row.isApproved ? 'success' : 'warning'">
              {{ row.isApproved ? "已审核" : "待审核" }}
            </el-tag>
          </template>
          <template #operation="{ row, size }">
            <el-button
              v-if="!row.isApproved"
              link
              type="primary"
              :size="size"
              @click="handleApprove(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="!row.isApproved"
              link
              type="warning"
              :size="size"
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="!row.isApproved"
              link
              type="danger"
              :size="size"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <span v-if="row.isApproved" class="text-gray-400">-</span>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="核销类型">
          <el-radio-group v-model="formData.type">
            <el-radio value="OFFSET">互抵核销</el-radio>
            <el-radio value="BAD_DEBT">坏账核销</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="客户">
          <el-select
            v-model="formData.customerId"
            placeholder="请选择客户"
            clearable
            filterable
            class="w-full!"
          >
            <el-option
              v-for="item in customerList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select
            v-model="formData.providerId"
            placeholder="请选择供应商"
            clearable
            filterable
            class="w-full!"
          >
            <el-option
              v-for="item in providerList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="应收金额">
          <el-input-number
            v-model="formData.receivableAmount"
            :min="0"
            :precision="2"
            class="w-full!"
          />
        </el-form-item>
        <el-form-item label="应付金额">
          <el-input-number
            v-model="formData.payableAmount"
            :min="0"
            :precision="2"
            class="w-full!"
          />
        </el-form-item>
        <el-form-item label="核销金额">
          <el-input-number
            v-model="formData.writeOffAmount"
            :min="0"
            :precision="2"
            class="w-full!"
          />
        </el-form-item>
        <el-form-item label="核销原因">
          <el-input v-model="formData.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import {
  getPaymentListApi,
  getPaymentApi,
  createPaymentApi,
  updatePaymentApi,
  checkPaymentBalanceApi,
  deletePaymentApi
} from "@/api";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { getCompanyId } from "@/api/company";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import editForm from "./form.vue";
import AccountOperationDialog from "./accountOperationDialog.vue";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "Payment"
});

const dataList = ref<any[]>([]);
const loading = ref(false);
const formRef = ref();
const editFormRef = ref<{ getRef: () => FormInstance } | null>(null);
const form = ref({
  companyUid: undefined
});
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// Operation Dialog State
const showOperationDialog = ref(false);
const currentPayment = ref<any>(null);
const operationType = ref<"top-up" | "pay" | "freeze" | "unfreeze">("top-up");

function handleOperation(
  row: any,
  type: "top-up" | "pay" | "freeze" | "unfreeze"
) {
  currentPayment.value = row;
  operationType.value = type;
  showOperationDialog.value = true;
}

const columns = ref<TableColumnList>([
  {
    label: "账户UID",
    prop: "uid"
  },
  {
    label: "公司UID",
    prop: "companyUid"
  },
  {
    label: "余额",
    prop: "balance",
    formatter: (row, column, cellValue) => {
      return typeof cellValue === "string" || typeof cellValue === "number"
        ? Number(cellValue).toFixed(2)
        : "0.00";
    }
  },
  {
    label: "创建时间",
    prop: "createAt",
    formatter: (row, column, cellValue) => {
      return cellValue ? new Date(cellValue).toLocaleString() : "-";
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 200
  }
]);

const getPaymentListInfo = async () => {
  loading.value = true;
  try {
    const companyUid = await getCompanyId();
    const { data, code, msg } = await getPaymentListApi(companyUid);
    if (code === 200) {
      const typedData = data as
        | { list?: unknown[]; count?: number }
        | unknown[];
      dataList.value = Array.isArray(typedData)
        ? typedData
        : typedData.list || [];
      pagination.value.total = Array.isArray(typedData)
        ? typedData.length
        : typedData.count || dataList.value.length;
    } else {
      message(msg, { type: "error" });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "获取支付账户列表失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
};

const onSearch = async () => {
  await getPaymentListInfo();
};

const resetForm = (formEl: any) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getPaymentListInfo();
}

async function handleCreate() {
  addDialog({
    title: "新增",
    props: {
      formInline: {
        title: "新增",
        name: "",
        type: "Alipay",
        account: "",
        realName: ""
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: editFormRef }),
    beforeSure: (done, { options }) => {
      const FormRef = editFormRef.value?.getRef();
      if (!FormRef) return;
      const curData = (
        options.props! as {
          formInline: {
            name: string;
            type: string;
            account: string;
            realName: string;
          };
        }
      ).formInline;
      FormRef.validate(async (valid: boolean) => {
        if (valid) {
          try {
            const companyUid = await getCompanyId();
            await createPaymentApi({
              companyUid,
              name: curData.name,
              type: curData.type,
              account: curData.account,
              realName: curData.realName
            });
            message("创建成功", { type: "success" });
            done();
            onSearch();
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "创建失败";
            message(msg, { type: "error" });
          }
        }
      });
    }
  });
}

// function handleRecharge(row) { ... } // Replaced by handleOperation

async function handleCheckBalance(row: any) {
  try {
    const { data, code, msg } = await checkPaymentBalanceApi(row.uid, 0);
    if (code === 200) {
      message(`当前余额: ${data.balance || 0}`, { type: "success" });
    } else {
      message(msg, { type: "error" });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "查询余额失败";
    message(msg, { type: "error" });
  }
}

async function handleDelete(row: any) {
  try {
    await deletePaymentApi(row.uid);
    message("删除成功", { type: "success" });
    await onSearch();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "删除失败";
    message(msg, { type: "error" });
  }
}

onMounted(async () => {
  await getPaymentListInfo();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form
        ref="formRef"
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
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
    </el-card>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="getPaymentListInfo">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="handleCreate"
          >
            创建支付账户
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="handleOperation(row, 'top-up')"
              >
                充值
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="warning"
                @click="handleOperation(row, 'pay')"
              >
                扣款
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="info"
                @click="handleOperation(row, 'freeze')"
              >
                冻结
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="handleCheckBalance(row)"
              >
                查询余额
              </el-button>

              <el-popconfirm
                :title="`是否确认删除该支付账户`"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="danger">
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>

    <AccountOperationDialog
      v-if="showOperationDialog"
      v-model:visible="showOperationDialog"
      :type="operationType"
      :payment-uid="currentPayment?.uid"
      :payment-name="currentPayment?.name"
      :current-balance="currentPayment?.balance || 0"
      @success="onSearch"
    />
  </div>
</template>

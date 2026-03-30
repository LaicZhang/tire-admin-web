<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import TableOperations from "@/components/TableOperations/index.vue";
import type { CustomAction } from "@/components/TableOperations/types";
import { v7 as uuid } from "uuid";
import type { FormInstance } from "element-plus";
import { useRoute } from "vue-router";
import {
  confirmPurchaseOrderArrivalApi,
  createPurchaseInboundFromPurchaseOrderApi,
  createPurchaseOrderApi,
  deletePurchaseOrderApi,
  getPurchaseOrderApi,
  getPurchaseOrderListApi,
  payPurchaseOrderApi,
  updatePurchaseOrderApi
} from "@/api/purchase";
import { getCompanyConnect, getCompanyId } from "@/api/company";
import { message, handleApiError } from "@/utils";
import { useActionFormDialog } from "@/composables/useActionFormDialog";
import { useOrderListPage } from "@/composables/useOrderListPage";
import { useOrderConfirmActions } from "@/composables/useOrderConfirmActions";
import { purchaseOrderColumns } from "./columns";
import type { PurchaseOrder, PurchaseOrderQueryParams } from "./types";
import editForm from "./form.vue";

defineOptions({
  name: "PurchaseOrder"
});

const route = useRoute();

type PurchaseOrderFormRef = {
  formRef?: FormInstance;
  getPayFee?: () => number;
};
const formRef = ref<PurchaseOrderFormRef | null>(null);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

// 使用订单列表页 composable
const {
  dataList,
  loading,
  pagination,
  searchForm,
  selectData,
  getList,
  onSearch,
  onReset,
  handlePageChange,
  handleSizeChange
} = useOrderListPage<PurchaseOrder, PurchaseOrderQueryParams>({
  listApi: (page, pageSize, query) =>
    getPurchaseOrderListApi(page, { ...query, pageSize }),
  selectDataKeys: ["employee", "manager", "provider"],
  initialQuery: {
    operatorId: undefined,
    auditorId: undefined,
    providerId: undefined,
    desc: undefined
  },
  listErrorMessage: "获取采购订单列表失败",
  searchFormRef
});

// 使用订单确认操作 composable
const { handleConfirmArrival } = useOrderConfirmActions({
  onSuccess: getList
});

// 获取下拉数据的别名引用
const employeeList = selectData.employee;
const managerList = selectData.manager;
const providerList = selectData.provider;

const { openDialog } = useActionFormDialog<PurchaseOrder, PurchaseOrderFormRef>(
  {
    entityName: "采购订单",
    formComponent: editForm,
    formRef,
    buildFormData: (row?: PurchaseOrder) =>
      row
        ? { ...row }
        : {
            uid: uuid(),
            providerId: "",
            count: 0,
            total: 0,
            showTotal: 0,
            paidAmount: 0,
            status: true,
            orderStatus: 0,
            logisticsStatus: 0,
            isApproved: false,
            isLocked: false,
            details: []
          },
    buildFormProps: (formInline: PurchaseOrder, formTitle) => ({
      formInline,
      formTitle
    }),
    handlers: {
      新增: async formData => {
        const companyId = await getCompanyId();
        const { details, provider, operator, auditor, ...orderData } = formData;

        if (details.length === 0) {
          message("请添加商品明细", { type: "warning" });
          return false;
        }
        await createPurchaseOrderApi({
          order: {
            ...orderData,
            company: getCompanyConnect(companyId),
            provider: { connect: { uid: orderData.providerId } },
            ...(orderData.auditorId
              ? { auditor: { connect: { uid: orderData.auditorId } } }
              : {})
          },
          details: details.map(d => ({ ...d, companyId }))
        });
        message("新增成功", { type: "success" });
      },
      修改: async formData => {
        const companyId = await getCompanyId();
        const {
          details: _details,
          provider,
          operator,
          auditor,
          ...orderData
        } = formData;
        await updatePurchaseOrderApi(formData.uid, {
          ...orderData,
          company: getCompanyConnect(companyId)
        });
        message("修改成功", { type: "success" });
      },
      审核: async formData => {
        const companyId = await getCompanyId();
        await updatePurchaseOrderApi(formData.uid, {
          isApproved: formData.isApproved,
          isLocked: formData.isApproved,
          rejectReason: formData.rejectReason,
          auditAt: formData.isApproved ? new Date().toISOString() : null,
          company: getCompanyConnect(companyId)
        });
        message("审核完成", { type: "success" });
      },
      付款: async formData => {
        if (!formData.paymentId) {
          message("请选择付款账户", { type: "warning" });
          return false;
        }
        const fee = Math.round(Number(formRef.value?.getPayFee?.() ?? 0));
        if (!Number.isFinite(fee) || fee <= 0) {
          message("请输入本次付款金额", { type: "warning" });
          return false;
        }
        await payPurchaseOrderApi(formData.uid, {
          fee,
          paymentId: formData.paymentId
        });
        message("付款成功", { type: "success" });
      }
    },
    afterSuccess: getList
  }
);

async function handleDelete(row: PurchaseOrder) {
  try {
    await deletePurchaseOrderApi(row.uid);
    message("删除成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
}

async function openFromRouteQuery() {
  const uid = route.query.uid;
  const action = route.query.action;
  if (typeof uid !== "string" || typeof action !== "string") return;

  const titleMap = {
    view: "查看",
    edit: "修改",
    audit: "审核",
    pay: "付款"
  } as const;
  if (!(action in titleMap)) return;
  const dialogAction = titleMap[action as keyof typeof titleMap];

  try {
    loading.value = true;
    const res = await getPurchaseOrderApi(uid);
    if (res.code === 200) {
      openDialog(dialogAction, res.data);
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "获取采购订单失败");
  } finally {
    loading.value = false;
  }
}

// 确认到货 - 使用 composable 封装的方法
async function onConfirmArrival(row: PurchaseOrder) {
  await handleConfirmArrival(row, confirmPurchaseOrderArrivalApi);
}

async function onCreateInboundDraft(row: PurchaseOrder) {
  try {
    const res = await createPurchaseInboundFromPurchaseOrderApi(row.uid);
    if (res.code !== 200) {
      message(res.msg, { type: "error" });
      return;
    }
    const created = res.data;
    message(
      `已生成采购入库草稿 ${created.docNo || created.number || created.uid}`,
      { type: "success" }
    );
  } catch (error) {
    handleApiError(error, "生成采购入库草稿失败");
  }
}

function getCustomActions(row: PurchaseOrder): CustomAction<PurchaseOrder>[] {
  return [
    {
      label: "付款",
      type: "primary",
      visible: row.isApproved && (row.paidAmount || 0) < (row.total || 0),
      onClick: target => openDialog("付款", target)
    },
    {
      label: "确认到货",
      type: "success",
      visible: row.isApproved && row.details?.some(detail => !detail.isArrival),
      onClick: onConfirmArrival
    },
    {
      label: "生成入库草稿",
      type: "primary",
      visible: row.isApproved && Boolean(row.uid),
      onClick: onCreateInboundDraft
    }
  ];
}

function handleView(row: PurchaseOrder) {
  openDialog("查看", row);
}

function handleEdit(row: PurchaseOrder) {
  openDialog("修改", row);
}

function handleAudit(row: PurchaseOrder) {
  openDialog("审核", row);
}

// 只处理路由参数，composable 已处理 loadSelectData 和 getList
onMounted(async () => {
  await openFromRouteQuery();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="searchForm"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="供应商">
        <el-select
          v-model="searchForm.providerId"
          placeholder="请选择供应商"
          clearable
          filterable
          class="w-[180px]"
        >
          <el-option
            v-for="item in providerList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作人">
        <el-select
          v-model="searchForm.operatorId"
          placeholder="请选择操作人"
          clearable
          class="w-[180px]"
        >
          <el-option
            v-for="item in employeeList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="审核人">
        <el-select
          v-model="searchForm.auditorId"
          placeholder="请选择审核人"
          clearable
          class="w-[180px]"
        >
          <el-option
            v-for="item in managerList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="searchForm.desc"
          placeholder="请输入备注关键词"
          clearable
          class="w-[180px]"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar title="采购订单" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增')"
          >
            新增订单
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns="purchaseOrderColumns"
            border
            :data="dataList"
            :loading="loading"
            show-overflow-tooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
            @page-size-change="handleSizeChange"
          >
            <template #operation="{ row }">
              <TableOperations
                :row="row"
                show-audit
                :delete-title="`确认删除编号 ${row.number} 的订单?`"
                :custom-actions="getCustomActions(row)"
                @view="handleView"
                @edit="handleEdit"
                @audit="handleAudit"
                @delete="handleDelete"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

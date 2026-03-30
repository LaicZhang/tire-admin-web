<script setup lang="ts">
import { ref, onMounted } from "vue";
import { v7 as uuid } from "uuid";
import type { FormInstance } from "element-plus";
import { useRoute } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import TableOperations from "@/components/TableOperations/index.vue";
import type { CustomAction } from "@/components/TableOperations/types";
import {
  approvePurchaseInboundApi,
  createPurchaseInboundApi,
  deletePurchaseInboundApi,
  getPurchaseInboundApi,
  getPurchaseInboundListApi,
  updatePurchaseInboundApi
} from "@/api/purchase";
import { getCompanyConnect, getCompanyId } from "@/api/company";
import { message, handleApiError } from "@/utils";
import { useActionFormDialog } from "@/composables/useActionFormDialog";
import { useOrderListPage } from "@/composables/useOrderListPage";
import { useUserStoreHook } from "@/store/modules/user";
import { inboundOrderColumns } from "./columns";
import {
  INBOUND_SOURCE_MODE_LABELS,
  type InboundOrder,
  type InboundOrderDetail,
  type InboundOrderQueryParams
} from "./types";
import editForm from "./form.vue";

defineOptions({
  name: "PurchaseInbound"
});

type InboundOrderFormRef = {
  formRef?: FormInstance;
};

const route = useRoute();
const userStore = useUserStoreHook();
const formRef = ref<InboundOrderFormRef | null>(null);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const sourceModeOptions = Object.entries(INBOUND_SOURCE_MODE_LABELS).map(
  ([value, label]) => ({ value, label })
);

function toNumber(value: unknown) {
  const resolved = Number(value ?? 0);
  return Number.isFinite(resolved) ? resolved : 0;
}

function normalizeInboundDetail(
  detail?: Partial<InboundOrderDetail>
): InboundOrderDetail {
  return {
    uid: detail?.uid,
    tireId: detail?.tireId || "",
    tireName: detail?.tireName,
    count: toNumber(detail?.count || 1),
    unitPrice: toNumber(detail?.unitPrice),
    total: toNumber(detail?.total),
    repoId: detail?.repoId || "",
    repoName: detail?.repoName,
    batchNo: detail?.batchNo || "",
    productionDate: detail?.productionDate || "",
    expiryDate: detail?.expiryDate || "",
    serialNumbers: detail?.serialNumbers || [],
    serialNosText: detail?.serialNosText || "",
    sourcePurchaseOrderDetailId: detail?.sourcePurchaseOrderDetailId,
    desc: detail?.desc || ""
  };
}

function createEmptyInboundOrder(): InboundOrder {
  return {
    uid: uuid(),
    docNo: "",
    providerId: "",
    count: 0,
    total: 0,
    showTotal: 0,
    paidAmount: 0,
    status: true,
    isApproved: false,
    isLocked: false,
    sourceMode: "MANUAL",
    desc: "",
    details: []
  };
}

function normalizeInboundOrder(order?: Partial<InboundOrder>): InboundOrder {
  if (!order) return createEmptyInboundOrder();

  const details = (order.details || []).map(normalizeInboundDetail);
  const total = toNumber(order.total);
  return {
    ...createEmptyInboundOrder(),
    ...order,
    total,
    showTotal: toNumber(order.showTotal ?? total),
    paidAmount: toNumber(order.paidAmount),
    count: toNumber(
      order.count ??
        details.reduce((sum, detail) => sum + toNumber(detail.count), 0)
    ),
    sourceMode: order.sourceMode || "MANUAL",
    desc: order.desc || "",
    details
  };
}

function validateCreateDetails(details: InboundOrderDetail[]) {
  if (details.length === 0) {
    message("请至少添加一条入库明细", { type: "warning" });
    return false;
  }

  const invalidDetail = details.find(
    detail => !detail.tireId || !detail.repoId
  );
  if (invalidDetail) {
    message("请为每条明细补全商品和仓库", { type: "warning" });
    return false;
  }

  return true;
}

function buildDetailsPayload(details: InboundOrderDetail[], companyId: string) {
  return details.map(detail => ({
    uid: detail.uid,
    companyId,
    tireId: detail.tireId,
    repoId: detail.repoId,
    count: toNumber(detail.count),
    unitPrice: toNumber(detail.unitPrice),
    total: toNumber(detail.total),
    batchNo: detail.batchNo || undefined,
    productionDate: detail.productionDate || undefined,
    expiryDate: detail.expiryDate || undefined,
    serialNumbers: detail.serialNumbers || [],
    sourcePurchaseOrderDetailId: detail.sourcePurchaseOrderDetailId,
    desc: detail.desc || undefined
  }));
}

function buildCreatePayload(formData: InboundOrder, companyId: string) {
  const userId = userStore.uid;
  if (!userId) {
    throw new Error("当前登录用户信息缺失，无法创建采购入库单");
  }

  return {
    order: {
      uid: formData.uid,
      count: toNumber(formData.count),
      total: toNumber(formData.total),
      paidAmount: toNumber(formData.paidAmount),
      desc: formData.desc || null,
      status: formData.status,
      isApproved: false,
      isLocked: false,
      sourceMode: formData.sourceMode || "MANUAL",
      company: getCompanyConnect(companyId),
      operator: { connect: { uid: userId } },
      provider: { connect: { uid: formData.providerId } },
      ...(formData.auditorId
        ? { auditor: { connect: { uid: formData.auditorId } } }
        : {}),
      ...(formData.sourcePurchaseOrderId
        ? { sourcePurchaseOrderId: formData.sourcePurchaseOrderId }
        : {})
    },
    details: buildDetailsPayload(formData.details, companyId)
  };
}

function buildUpdatePayload(formData: InboundOrder, companyId: string) {
  return {
    count: toNumber(formData.count),
    total: toNumber(formData.total),
    paidAmount: toNumber(formData.paidAmount),
    desc: formData.desc || null,
    status: formData.status,
    sourceMode: formData.sourceMode || "MANUAL",
    company: getCompanyConnect(companyId),
    provider: { connect: { uid: formData.providerId } },
    ...(formData.auditorId
      ? { auditor: { connect: { uid: formData.auditorId } } }
      : {}),
    ...(formData.sourcePurchaseOrderId
      ? {
          sourcePurchaseOrder: {
            connect: { uid: formData.sourcePurchaseOrderId }
          }
        }
      : {})
  };
}

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
} = useOrderListPage<InboundOrder, InboundOrderQueryParams>({
  listApi: (page, pageSize, query) =>
    getPurchaseInboundListApi(page, { ...query, pageSize }),
  selectDataKeys: ["employee", "manager", "provider"],
  initialQuery: {
    operatorId: undefined,
    auditorId: undefined,
    providerId: undefined,
    sourceMode: undefined,
    desc: undefined
  },
  pageSize: PAGE_SIZE_SMALL,
  listErrorMessage: "获取采购入库单列表失败",
  searchFormRef
});

const employeeList = selectData.employee;
const managerList = selectData.manager;
const providerList = selectData.provider;

const { openDialog } = useActionFormDialog<InboundOrder, InboundOrderFormRef>({
  entityName: "采购入库单",
  formComponent: editForm,
  formRef,
  buildFormData: row => normalizeInboundOrder(row),
  buildFormProps: (formInline, formTitle) => ({
    formInline,
    formTitle
  }),
  handlers: {
    新增: async formData => {
      if (!validateCreateDetails(formData.details)) return false;
      const companyId = getCompanyId();
      await createPurchaseInboundApi(buildCreatePayload(formData, companyId));
      message("新增成功", { type: "success" });
    },
    修改: async formData => {
      const companyId = getCompanyId();
      await updatePurchaseInboundApi(
        formData.uid,
        buildUpdatePayload(formData, companyId)
      );
      message("修改成功", { type: "success" });
    },
    审核: async formData => {
      if (!formData.isApproved) {
        message("采购入库单当前仅支持审核通过，请勿在此弹窗内选择驳回", {
          type: "warning"
        });
        return false;
      }
      await approvePurchaseInboundApi(formData.uid);
      message("审核完成", { type: "success" });
    }
  },
  afterSuccess: getList
});

function openAuditDialog(row: InboundOrder) {
  openDialog("审核", {
    ...normalizeInboundOrder(row),
    isApproved: true,
    rejectReason: ""
  });
}

async function handleDelete(row: InboundOrder) {
  try {
    await deletePurchaseInboundApi(row.uid);
    message("删除成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "删除采购入库单失败");
  }
}

function handleGenerateReturnGuide(row: InboundOrder) {
  message(
    `采购入库单 ${row.docNo || row.number || row.uid} 的后续退货请走采购退货流程`,
    {
      type: "info"
    }
  );
}

function getCustomActions(row: InboundOrder): CustomAction<InboundOrder>[] {
  return [
    {
      label: "退货指引",
      type: "warning",
      visible: row.isApproved,
      onClick: handleGenerateReturnGuide
    }
  ];
}

function handleView(row: InboundOrder) {
  openDialog("查看", row);
}

function handleEdit(row: InboundOrder) {
  openDialog("修改", row);
}

async function openFromRouteQuery() {
  const uid = route.query.uid;
  const action = route.query.action;
  if (typeof uid !== "string" || typeof action !== "string") return;

  const titleMap = {
    view: "查看",
    edit: "修改",
    audit: "审核"
  } as const;
  if (!(action in titleMap)) return;

  try {
    loading.value = true;
    const res = await getPurchaseInboundApi(uid);
    if (res.code !== 200) {
      message(res.msg, { type: "error" });
      return;
    }

    const normalized = normalizeInboundOrder(res.data);
    if (action === "audit") {
      openAuditDialog(normalized);
      return;
    }
    openDialog(titleMap[action as keyof typeof titleMap], normalized);
  } catch (error) {
    handleApiError(error, "获取采购入库单失败");
  } finally {
    loading.value = false;
  }
}

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
      <el-form-item label="来源方式">
        <el-select
          v-model="searchForm.sourceMode"
          placeholder="请选择来源方式"
          clearable
          class="w-[180px]"
        >
          <el-option
            v-for="item in sourceModeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
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
      <PureTableBar title="采购入库单" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增')"
          >
            新增入库单
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns="inboundOrderColumns"
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
                :delete-title="`确认删除编号 ${row.docNo || row.number} 的采购入库单?`"
                :custom-actions="getCustomActions(row)"
                @view="handleView"
                @edit="handleEdit"
                @audit="openAuditDialog"
                @delete="handleDelete"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

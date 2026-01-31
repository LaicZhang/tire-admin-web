<script setup lang="ts">
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import TableOperations from "@/components/TableOperations/index.vue";
import type { CustomAction } from "@/components/TableOperations/types";
import { v7 as uuid } from "uuid";
import type { FormInstance } from "element-plus";
import { getCompanyId } from "@/api";
import {
  getSalesOrderListApi,
  createSalesOrderApi,
  updateSalesOrderApi,
  deleteSalesOrderApi,
  paySaleOrderApi,
  confirmSaleOrderShipmentApi,
  confirmSaleOrderDeliveryApi
} from "@/api/sales";
import { message, handleApiError } from "@/utils";
import { useActionFormDialog } from "@/composables/useActionFormDialog";
import { useOrderListPage } from "@/composables/useOrderListPage";
import { useOrderConfirmActions } from "@/composables/useOrderConfirmActions";
import { salesOrderColumns } from "./columns";
import type { SalesOrder, SalesOrderQueryParams } from "./types";
import editForm from "./form.vue";

defineOptions({
  name: "SalesOrder"
});

type SalesOrderFormRef = {
  getRef: () => FormInstance;
  getReceiveFee?: () => number;
};
const formRef = ref<SalesOrderFormRef | null>(null);
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
  handlePageChange
} = useOrderListPage<SalesOrder, SalesOrderQueryParams>({
  listApi: getSalesOrderListApi,
  selectDataKeys: ["employee", "manager", "customer"],
  initialQuery: {
    operatorId: undefined,
    auditorId: undefined,
    customerId: undefined,
    desc: undefined
  },
  listErrorMessage: "获取销售订单列表失败",
  searchFormRef
});

// 使用订单确认操作 composable
const { handleConfirmShipment, handleConfirmDelivery } = useOrderConfirmActions(
  {
    onSuccess: getList
  }
);

// 获取下拉数据的别名引用
const employeeList = selectData.employee;
const managerList = selectData.manager;
const customerList = selectData.customer;

const { openDialog } = useActionFormDialog<SalesOrder, SalesOrderFormRef>({
  entityName: "销售订单",
  formComponent: editForm,
  formRef,
  buildFormData: (row?: SalesOrder) =>
    row
      ? { ...row }
      : {
          uid: uuid(),
          customerId: "",
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
  buildFormProps: (formInline: SalesOrder, formTitle) => ({
    formInline,
    formTitle
  }),
  handlers: {
    新增: async formData => {
      const companyId = await getCompanyId();
      const { details, customer, operator, auditor, ...orderData } = formData;

      if (details.length === 0) {
        message("请添加商品明细", { type: "warning" });
        return false;
      }
      await createSalesOrderApi({
        order: {
          ...orderData,
          company: { connect: { uid: companyId } },
          customer: { connect: { uid: orderData.customerId } },
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
        customer,
        operator,
        auditor,
        ...orderData
      } = formData;
      await updateSalesOrderApi(formData.uid, {
        ...orderData,
        company: { connect: { uid: companyId } }
      });
      message("修改成功", { type: "success" });
    },
    审核: async formData => {
      const companyId = await getCompanyId();
      await updateSalesOrderApi(formData.uid, {
        isApproved: formData.isApproved,
        isLocked: formData.isApproved,
        rejectReason: formData.rejectReason,
        auditAt: formData.isApproved ? new Date().toISOString() : null,
        company: { connect: { uid: companyId } }
      });
      message("审核完成", { type: "success" });
    },
    收款: async formData => {
      if (!formData.paymentId) {
        message("请选择收款账户", { type: "warning" });
        return false;
      }
      const fee = Math.round(Number(formRef.value?.getReceiveFee?.() ?? 0));
      if (!Number.isFinite(fee) || fee <= 0) {
        message("请输入本次收款金额", { type: "warning" });
        return false;
      }
      await paySaleOrderApi(formData.uid, {
        fee,
        paymentId: formData.paymentId
      });
      message("收款成功", { type: "success" });
    }
  },
  afterSuccess: getList
});

async function handleDelete(row: SalesOrder) {
  try {
    await deleteSalesOrderApi(row.uid);
    message("删除成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
}

// 发货确认 - 使用 composable 封装的方法
async function onConfirmShipment(row: SalesOrder) {
  await handleConfirmShipment(row, confirmSaleOrderShipmentApi);
}

// 送达确认 - 使用 composable 封装的方法
async function onConfirmDelivery(row: SalesOrder) {
  await handleConfirmDelivery(row, confirmSaleOrderDeliveryApi);
}
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      class="m-1"
      :form="searchForm"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="客户">
        <el-select
          v-model="searchForm.customerId"
          placeholder="请选择客户"
          clearable
          filterable
          class="w-[180px]"
        >
          <el-option
            v-for="item in customerList"
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
      <PureTableBar title="销售订单" @refresh="getList">
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
            :columns="salesOrderColumns"
            border
            :data="dataList"
            :loading="loading"
            show-overflow-tooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
          >
            <template #operation="{ row }">
              <TableOperations
                :row="row"
                show-audit
                :delete-title="`确认删除编号 ${row.number} 的订单?`"
                :custom-actions="
                  [
                    {
                      label: '收款',
                      type: 'primary',
                      visible:
                        row.isApproved &&
                        (row.paidAmount || 0) < (row.total || 0),
                      onClick: () => openDialog('收款', row)
                    },
                    {
                      label: '确认发货',
                      type: 'success',
                      visible:
                        (row as SalesOrder).isApproved &&
                        (row as SalesOrder).details?.some(d => !d.isShipped),
                      onClick: () => onConfirmShipment(row as SalesOrder)
                    },
                    {
                      label: '确认送达',
                      type: 'success',
                      visible:
                        (row as SalesOrder).isApproved &&
                        (row as SalesOrder).details?.some(
                          d => d.isShipped && !d.isDelivered
                        ),
                      onClick: () => onConfirmDelivery(row as SalesOrder)
                    }
                  ] as CustomAction[]
                "
                @view="openDialog('查看', $event as unknown as SalesOrder)"
                @edit="openDialog('修改', $event as unknown as SalesOrder)"
                @audit="openDialog('审核', $event as unknown as SalesOrder)"
                @delete="handleDelete($event as unknown as SalesOrder)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

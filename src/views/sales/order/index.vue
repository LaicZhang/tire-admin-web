<script setup lang="ts">
import { h, onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
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
import { message, ALL_LIST, localForage, handleApiError } from "@/utils";
import { salesOrderColumns } from "./columns";
import type { SalesOrder, SalesOrderQueryParams } from "./types";
import editForm from "./form.vue";

defineOptions({
  name: "SalesOrder"
});

const dataList = ref<SalesOrder[]>([]);
const loading = ref(false);
const formRef = ref<{
  getRef: () => FormInstance;
  getReceiveFee?: () => number;
} | null>(null);
const searchFormRef = ref<{ resetFields: () => void }>();

const searchForm = ref<SalesOrderQueryParams>({
  operatorId: undefined,
  auditorId: undefined,
  customerId: undefined,
  desc: undefined
});

const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const employeeList = ref<unknown[]>([]);
const managerList = ref<unknown[]>([]);
const customerList = ref<unknown[]>([]);

async function loadSelectData() {
  const [employees, managers, customers] = await Promise.all([
    localForage().getItem(ALL_LIST.employee),
    localForage().getItem(ALL_LIST.manager),
    localForage().getItem(ALL_LIST.customer)
  ]);
  employeeList.value = (employees as unknown[]) || [];
  managerList.value = (managers as unknown[]) || [];
  customerList.value = (customers as unknown[]) || [];
}

async function getList() {
  try {
    loading.value = true;
    const res = await getSalesOrderListApi(
      pagination.value.currentPage,
      searchForm.value
    );
    if (res.code === 200) {
      dataList.value = res.data.list;
      pagination.value.total = res.data.count;
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "获取销售订单列表失败");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.value.currentPage = 1;
  getList();
}

function onReset(formEl: { resetFields: () => void } | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
}

function handlePageChange(page: number) {
  pagination.value.currentPage = page;
  getList();
}

function openDialog(title: string, row?: SalesOrder) {
  const formData: SalesOrder = row
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
      };

  addDialog({
    title: `${title}销售订单`,
    props: {
      formInline: formData,
      formTitle: title
    },
    width: "90%",
    hideFooter: title === "查看",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h(editForm, {
        ref: formRef,
        formInline: formData,
        formTitle: title
      }),
    beforeSure: async done => {
      const FormRef = formRef.value?.getRef();
      if (!FormRef) return;

      FormRef.validate(async (valid: boolean) => {
        if (!valid) return;

        try {
          const companyId = await getCompanyId();
          const { details, ...orderData } = formData;

          if (title === "新增") {
            if (details.length === 0) {
              message("请添加商品明细", { type: "warning" });
              return;
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
          } else if (title === "修改") {
            await updateSalesOrderApi(formData.uid, {
              ...orderData,
              company: { connect: { uid: companyId } }
            });
            message("修改成功", { type: "success" });
          } else if (title === "审核") {
            await updateSalesOrderApi(formData.uid, {
              isApproved: formData.isApproved,
              isLocked: formData.isApproved,
              rejectReason: formData.rejectReason,
              auditAt: formData.isApproved ? new Date().toISOString() : null,
              company: { connect: { uid: companyId } }
            });
            message("审核完成", { type: "success" });
          } else if (title === "收款") {
            if (!formData.paymentId) {
              message("请选择收款账户", { type: "warning" });
              return;
            }
            const fee = Math.round(
              Number(formRef.value?.getReceiveFee?.() ?? 0)
            );
            if (!Number.isFinite(fee) || fee <= 0) {
              message("请输入本次收款金额", { type: "warning" });
              return;
            }
            await paySaleOrderApi(formData.uid, {
              fee,
              paymentId: formData.paymentId
            });
            message("收款成功", { type: "success" });
          }
          done();
          getList();
        } catch (error) {
          handleApiError(error, `${title}失败`);
        }
      });
    }
  });
}

async function handleDelete(row: SalesOrder) {
  try {
    await deleteSalesOrderApi(row.uid);
    message("删除成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
}

async function handleConfirmShipment(row: SalesOrder) {
  const pendingDetails = row.details.filter(d => !d.isShipped);
  if (pendingDetails.length === 0) {
    message("所有商品已发货", { type: "info" });
    return;
  }

  try {
    for (const detail of pendingDetails) {
      if (detail.uid) {
        await confirmSaleOrderShipmentApi(row.uid, {
          detailUid: detail.uid,
          shipCount: detail.count
        });
      }
    }
    message("确认发货成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "确认发货失败");
  }
}

async function handleConfirmDelivery(row: SalesOrder) {
  const shippedDetails = row.details.filter(d => d.isShipped && !d.isDelivered);
  if (shippedDetails.length === 0) {
    message("所有商品已送达", { type: "info" });
    return;
  }

  try {
    for (const detail of shippedDetails) {
      if (detail.uid) {
        await confirmSaleOrderDeliveryApi(row.uid, { detailUid: detail.uid });
      }
    }
    message("确认送达成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "确认送达失败");
  }
}

onMounted(async () => {
  await loadSelectData();
  getList();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      class="m-1"
      :form="searchForm"
      :loading="loading"
      @search="onSearch"
      @reset="onReset(searchFormRef)"
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
              <el-button link type="primary" @click="openDialog('查看', row)">
                查看
              </el-button>
              <el-button
                v-if="!row.isLocked"
                link
                type="primary"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <el-button
                v-if="!row.isApproved"
                link
                type="primary"
                @click="openDialog('审核', row)"
              >
                审核
              </el-button>
              <el-button
                v-if="
                  row.isApproved && (row.paidAmount || 0) < (row.total || 0)
                "
                link
                type="primary"
                @click="openDialog('收款', row)"
              >
                收款
              </el-button>
              <el-button
                v-if="row.isApproved && row.logisticsStatus === 0"
                link
                type="success"
                @click="handleConfirmShipment(row)"
              >
                确认发货
              </el-button>
              <el-button
                v-if="row.isApproved && row.logisticsStatus === 1"
                link
                type="success"
                @click="handleConfirmDelivery(row)"
              >
                确认送达
              </el-button>
              <el-popconfirm
                v-if="!row.isLocked"
                :title="`确认删除编号 ${row.number} 的订单?`"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

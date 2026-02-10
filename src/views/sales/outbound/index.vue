<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { h, onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import TableOperations from "@/components/TableOperations/index.vue";
import type { CustomAction } from "@/components/TableOperations/types";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { v7 as uuid } from "uuid";
import type { FormInstance } from "element-plus";
import { getCompanyId } from "@/api";
import {
  getSalesOutboundListApi,
  createSalesOutboundApi,
  updateSalesOutboundApi,
  deleteSalesOutboundApi,
  confirmSaleOrderShipmentApi
} from "@/api/sales";
import { message, ALL_LIST, localForage, handleApiError } from "@/utils";
import { outboundOrderColumns } from "./columns";
import type { OutboundOrder, OutboundOrderQueryParams } from "./types";
import editForm from "./form.vue";

defineOptions({
  name: "SalesOutbound"
});

const dataList = ref<OutboundOrder[]>([]);
const loading = ref(false);
const formRef = ref<{ getRef: () => FormInstance } | null>(null);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const searchForm = ref<OutboundOrderQueryParams>({
  operatorId: undefined,
  auditorId: undefined,
  customerId: undefined,
  desc: undefined
});

const pagination = ref({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

interface SelectItem {
  uid: string;
  name: string;
}

const employeeList = ref<SelectItem[]>([]);
const managerList = ref<SelectItem[]>([]);
const customerList = ref<SelectItem[]>([]);

async function loadSelectData() {
  const [employees, managers, customers] = await Promise.all([
    localForage().getItem(ALL_LIST.employee),
    localForage().getItem(ALL_LIST.manager),
    localForage().getItem(ALL_LIST.customer)
  ]);
  employeeList.value = (employees as SelectItem[]) || [];
  managerList.value = (managers as SelectItem[]) || [];
  customerList.value = (customers as SelectItem[]) || [];
}

async function getList() {
  try {
    loading.value = true;
    const res = await getSalesOutboundListApi(
      pagination.value.currentPage,
      searchForm.value
    );
    if (res.code === 200) {
      const result = res.data as { list: OutboundOrder[]; count: number };
      dataList.value = result.list;
      pagination.value.total = result.count;
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "获取销售出库单列表失败");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.value.currentPage = 1;
  getList();
}

function onReset() {
  searchFormRef.value?.resetFields();
  pagination.value.currentPage = 1;
  getList();
}

function handlePageChange(page: number) {
  pagination.value.currentPage = page;
  getList();
}

function openDialog(title: string, row?: OutboundOrder) {
  const formData: OutboundOrder = row
    ? { ...row }
    : {
        uid: uuid(),
        customerId: "",
        count: 0,
        total: 0,
        showTotal: 0,
        paidAmount: 0,
        status: true,
        logisticsStatus: 0,
        isApproved: false,
        isLocked: false,
        details: []
      };

  addDialog({
    title: `${title}销售出库单`,
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
          const {
            details,
            customer,
            operator,
            auditor,
            saleOrder,
            ...orderData
          } = formData;

          if (title === "新增") {
            if (details.length === 0) {
              message("请添加出库明细", { type: "warning" });
              return;
            }
            await createSalesOutboundApi({
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
            await updateSalesOutboundApi(formData.uid, {
              ...orderData,
              company: { connect: { uid: companyId } }
            });
            message("修改成功", { type: "success" });
          } else if (title === "审核") {
            await updateSalesOutboundApi(formData.uid, {
              isApproved: formData.isApproved,
              isLocked: formData.isApproved,
              rejectReason: formData.rejectReason,
              auditAt: formData.isApproved ? new Date().toISOString() : null,
              company: { connect: { uid: companyId } }
            });
            message("审核完成", { type: "success" });
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

async function handleDelete(row: OutboundOrder) {
  try {
    await deleteSalesOutboundApi(row.uid);
    message("删除成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
}

async function handleConfirmShipment(row: OutboundOrder) {
  const pendingDetails = row.details.filter(d => !d.isShipped);
  if (pendingDetails.length === 0) {
    message("所有商品已发货", { type: "info" });
    return;
  }

  try {
    if (row.saleOrderId) {
      for (const detail of pendingDetails) {
        if (detail.uid) {
          await confirmSaleOrderShipmentApi(row.saleOrderId, {
            detailUid: detail.uid,
            shipCount: detail.count
          });
        }
      }
    }
    message("确认发货成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "确认发货失败");
  }
}

async function handleGenerateReturnOrder(row: OutboundOrder) {
  message(`生成销售退货单功能开发中，出库单: ${row.number}`, { type: "info" });
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
      <PureTableBar title="销售出库单" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增')"
          >
            新增出库单
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns="outboundOrderColumns"
            border
            :data="dataList"
            :loading="loading"
            show-overflow-tooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
          >
            <template #operation="{ row }">
              <TableOperations
                :row="row as OutboundOrder"
                show-audit
                :delete-title="`确认删除编号 ${row.number} 的出库单?`"
                :custom-actions="
                  [
                    {
                      label: '确认发货',
                      type: 'success',
                      visible: (r: OutboundOrder) =>
                        r.isApproved && r.details?.some(d => !d.isShipped),
                      onClick: (r: OutboundOrder) => handleConfirmShipment(r)
                    },
                    {
                      label: '生成退货单',
                      type: 'warning',
                      visible: (r: OutboundOrder) => r.isApproved,
                      onClick: (r: OutboundOrder) =>
                        handleGenerateReturnOrder(r)
                    }
                  ] as CustomAction<OutboundOrder>[]
                "
                @view="openDialog('查看', $event as OutboundOrder)"
                @edit="openDialog('修改', $event as OutboundOrder)"
                @audit="openDialog('审核', $event as OutboundOrder)"
                @delete="handleDelete($event as OutboundOrder)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

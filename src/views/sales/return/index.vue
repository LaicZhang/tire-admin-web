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
  getSalesReturnOrderListApi,
  createSalesReturnOrderApi,
  updateSalesReturnOrderApi,
  deleteSalesReturnOrderApi,
  confirmReturnOrderArrivalApi,
  refundReturnOrderApi
} from "@/api/sales";
import { message, ALL_LIST, localForage, handleApiError } from "@/utils";
import { salesReturnColumns } from "./columns";
import type { SalesReturnOrder, SalesReturnQueryParams } from "./types";
import editForm from "./form.vue";

defineOptions({
  name: "SalesReturn"
});

const dataList = ref<SalesReturnOrder[]>([]);
const loading = ref(false);
const formRef = ref<{ getRef: () => FormInstance } | null>(null);
const searchFormRef = ref<{ resetFields: () => void }>();

const searchForm = ref<SalesReturnQueryParams>({
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
    const res = await getSalesReturnOrderListApi(pagination.value.currentPage, {
      ...searchForm.value,
      customerId: searchForm.value.customerId
    });
    if (res.code === 200) {
      dataList.value = res.data.list.filter((item: unknown) => item.customerId);
      pagination.value.total = dataList.value.length;
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "获取销售退货单列表失败");
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

function openDialog(title: string, row?: SalesReturnOrder) {
  const formData: SalesReturnOrder = row
    ? { ...row }
    : {
        uid: uuid(),
        customerId: "",
        count: 0,
        total: 0,
        showTotal: 0,
        refundAmount: 0,
        status: true,
        isApproved: false,
        isLocked: false,
        logisticsStatus: 0,
        details: []
      };

  addDialog({
    title: `${title}销售退货单`,
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
              message("请添加退货明细", { type: "warning" });
              return;
            }
            await createSalesReturnOrderApi({
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
            await updateSalesReturnOrderApi(formData.uid, {
              ...orderData,
              company: { connect: { uid: companyId } }
            });
            message("修改成功", { type: "success" });
          } else if (title === "审核") {
            await updateSalesReturnOrderApi(formData.uid, {
              isApproved: formData.isApproved,
              isLocked: formData.isApproved,
              rejectReason: formData.rejectReason,
              auditAt: formData.isApproved ? new Date().toISOString() : null,
              company: { connect: { uid: companyId } }
            });
            message("审核完成", { type: "success" });
          } else if (title === "退款") {
            await refundReturnOrderApi(formData.uid, {
              fee: formData.refundAmount || 0
            });
            message("退款成功", { type: "success" });
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

async function handleDelete(row: SalesReturnOrder) {
  try {
    await deleteSalesReturnOrderApi(row.uid);
    message("删除成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
}

async function handleConfirmArrival(row: SalesReturnOrder) {
  try {
    const details = row.details || [];
    for (const detail of details) {
      if (detail.uid) {
        await confirmReturnOrderArrivalApi(row.uid, { detailUid: detail.uid });
      }
    }
    message("确认收货成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "确认收货失败");
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
      <PureTableBar title="销售退货单" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增')"
          >
            新增退货单
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size
            :columns="salesReturnColumns"
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
                v-if="row.isApproved && row.logisticsStatus === 0"
                link
                type="success"
                @click="handleConfirmArrival(row)"
              >
                确认收货
              </el-button>
              <el-button
                v-if="row.isApproved"
                link
                type="warning"
                @click="openDialog('退款', row)"
              >
                退款
              </el-button>
              <el-popconfirm
                v-if="!row.isLocked"
                :title="`确认删除编号 ${row.number} 的退货单?`"
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

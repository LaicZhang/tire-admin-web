<script setup lang="ts">
import { h, onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { v7 as uuid } from "uuid";
import type { FormInstance } from "element-plus";
import { useRoute } from "vue-router";
import {
  confirmPurchaseOrderArrivalApi,
  createPurchaseOrderApi,
  deletePurchaseOrderApi,
  getPurchaseOrderApi,
  getPurchaseOrderListApi,
  payPurchaseOrderApi,
  updatePurchaseOrderApi
} from "@/api/purchase";
import { getCompanyId } from "@/api/company";
import { message, ALL_LIST, localForage, handleApiError } from "@/utils";
import { purchaseOrderColumns } from "./columns";
import type {
  PurchaseOrder,
  PurchaseOrderQueryParams,
  OptionItem
} from "./types";
import editForm from "./form.vue";

defineOptions({
  name: "PurchaseOrder"
});

const route = useRoute();

const dataList = ref<PurchaseOrder[]>([]);
const loading = ref(false);
const formRef = ref<{
  getRef: () => FormInstance;
  getPayFee?: () => number;
} | null>(null);

const searchForm = ref<PurchaseOrderQueryParams>({
  operatorId: undefined,
  auditorId: undefined,
  providerId: undefined,
  desc: undefined
});

const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const employeeList = ref<OptionItem[]>([]);
const managerList = ref<OptionItem[]>([]);
const providerList = ref<OptionItem[]>([]);

async function loadSelectData() {
  try {
    const [employees, managers, providers] = await Promise.all([
      localForage().getItem(ALL_LIST.employee),
      localForage().getItem(ALL_LIST.manager),
      localForage().getItem(ALL_LIST.provider)
    ]);
    employeeList.value = (employees as OptionItem[]) || [];
    managerList.value = (managers as OptionItem[]) || [];
    providerList.value = (providers as OptionItem[]) || [];
  } catch (error) {
    handleApiError(error, "加载下拉数据失败");
  }
}

async function getList() {
  try {
    loading.value = true;
    const res = await getPurchaseOrderListApi(
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
    handleApiError(error, "获取采购订单列表失败");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.value.currentPage = 1;
  getList();
}

function onReset(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
}

function handlePageChange(page: number) {
  pagination.value.currentPage = page;
  getList();
}

function openDialog(title: string, row?: PurchaseOrder) {
  const formData: PurchaseOrder = row
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
      };

  addDialog({
    title: `${title}采购订单`,
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
            await createPurchaseOrderApi({
              order: {
                ...orderData,
                company: { connect: { uid: companyId } },
                provider: { connect: { uid: orderData.providerId } },
                ...(orderData.auditorId
                  ? { auditor: { connect: { uid: orderData.auditorId } } }
                  : {})
              },
              details: details.map(d => ({ ...d, companyId }))
            });
            message("新增成功", { type: "success" });
          } else if (title === "修改") {
            await updatePurchaseOrderApi(formData.uid, {
              ...orderData,
              company: { connect: { uid: companyId } }
            });
            message("修改成功", { type: "success" });
          } else if (title === "审核") {
            await updatePurchaseOrderApi(formData.uid, {
              isApproved: formData.isApproved,
              isLocked: formData.isApproved,
              rejectReason: formData.rejectReason,
              auditAt: formData.isApproved ? new Date().toISOString() : null,
              company: { connect: { uid: companyId } }
            });
            message("审核完成", { type: "success" });
          } else if (title === "付款") {
            if (!formData.paymentId) {
              message("请选择付款账户", { type: "warning" });
              return;
            }
            const fee = Math.round(Number(formRef.value?.getPayFee?.() ?? 0));
            if (!Number.isFinite(fee) || fee <= 0) {
              message("请输入本次付款金额", { type: "warning" });
              return;
            }
            await payPurchaseOrderApi(formData.uid, {
              fee,
              paymentId: formData.paymentId
            });
            message("付款成功", { type: "success" });
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

  const titleMap: Record<string, string> = {
    view: "查看",
    edit: "修改",
    audit: "审核",
    pay: "付款"
  };
  const title = titleMap[action];
  if (!title) return;

  try {
    loading.value = true;
    const res = await getPurchaseOrderApi(uid);
    if (res.code === 200) {
      openDialog(title, res.data as PurchaseOrder);
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "获取采购订单失败");
  } finally {
    loading.value = false;
  }
}

async function handleConfirmArrival(row: PurchaseOrder) {
  const pendingDetails = row.details.filter(d => !d.isArrival);
  if (pendingDetails.length === 0) {
    message("所有商品已到货", { type: "info" });
    return;
  }

  try {
    for (const detail of pendingDetails) {
      if (detail.uid) {
        await confirmPurchaseOrderArrivalApi(row.uid, {
          detailUid: detail.uid
        });
      }
    }
    message("确认到货成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "确认到货失败");
  }
}

onMounted(async () => {
  await loadSelectData();
  await getList();
  await openFromRouteQuery();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-form :inline="true" class="search-form">
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
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="onSearch"
          >
            搜索
          </el-button>
          <el-button :icon="useRenderIcon(Refresh)" @click="onReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

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
                @click="openDialog('付款', row)"
              >
                付款
              </el-button>
              <el-button
                v-if="row.isApproved && row.logisticsStatus < 2"
                link
                type="success"
                @click="handleConfirmArrival(row)"
              >
                确认到货
              </el-button>
              <DeleteButton
                v-if="!row.isLocked"
                :show-icon="false"
                :title="`确认删除编号 ${row.number} 的订单?`"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

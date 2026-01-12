<script setup lang="ts">
import { h, onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import TableOperationsWithCustomization from "@/components/TableOperations/TableOperationsWithCustomization.vue";
import type { CustomAction } from "@/components/TableOperations/types";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { v7 as uuid } from "uuid";
import type { FormInstance } from "element-plus";
import { useRoute } from "vue-router";
import {
  confirmReturnOrderShipmentApi,
  createPurchaseReturnOrderApi,
  deletePurchaseReturnOrderApi,
  getPurchaseReturnOrderApi,
  getPurchaseReturnOrderListApi,
  refundReturnOrderApi,
  updatePurchaseReturnOrderApi
} from "@/api/purchase";
import { getCompanyId } from "@/api/company";
import { message, ALL_LIST, localForage, handleApiError } from "@/utils";
import { returnOrderColumns } from "./columns";
import type { ReturnOrder, ReturnOrderQueryParams } from "./types";
import editForm from "./form.vue";

defineOptions({
  name: "PurchaseReturn"
});

const route = useRoute();

const dataList = ref<ReturnOrder[]>([]);
const loading = ref(false);
const formRef = ref<{ getRef: () => FormInstance } | null>(null);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const searchForm = ref<ReturnOrderQueryParams>({
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

const employeeList = ref<unknown[]>([]);
const managerList = ref<unknown[]>([]);
const providerList = ref<unknown[]>([]);

async function loadSelectData() {
  try {
    const [employees, managers, providers] = await Promise.all([
      localForage().getItem(ALL_LIST.employee),
      localForage().getItem(ALL_LIST.manager),
      localForage().getItem(ALL_LIST.provider)
    ]);
    employeeList.value = (employees as unknown[]) || [];
    managerList.value = (managers as unknown[]) || [];
    providerList.value = (providers as unknown[]) || [];
  } catch (error) {
    handleApiError(error, "加载下拉数据失败");
  }
}

async function getList() {
  try {
    loading.value = true;
    const res = await getPurchaseReturnOrderListApi(
      pagination.value.currentPage,
      { ...searchForm.value, providerId: searchForm.value.providerId }
    );
    if (res.code === 200) {
      dataList.value = res.data.list as ReturnOrder[];
      pagination.value.total = res.data.count;
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "获取采购退货单列表失败");
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

function openDialog(title: string, row?: ReturnOrder) {
  const formData: ReturnOrder = row
    ? { ...row }
    : {
        uid: uuid(),
        providerId: "",
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
    title: `${title}采购退货单`,
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
            await createPurchaseReturnOrderApi({
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
            await updatePurchaseReturnOrderApi(formData.uid, {
              ...orderData,
              company: { connect: { uid: companyId } }
            });
            message("修改成功", { type: "success" });
          } else if (title === "审核") {
            await updatePurchaseReturnOrderApi(formData.uid, {
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

async function handleDelete(row: ReturnOrder) {
  try {
    await deletePurchaseReturnOrderApi(row.uid);
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
    refund: "退款"
  };
  const title = titleMap[action];
  if (!title) return;

  try {
    loading.value = true;
    const res = await getPurchaseReturnOrderApi(uid);
    if (res.code === 200) {
      openDialog(title, res.data as ReturnOrder);
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    handleApiError(error, "获取采购退货单失败");
  } finally {
    loading.value = false;
  }
}

async function handleConfirmShipment(row: ReturnOrder) {
  try {
    const details = row.details || [];
    for (const detail of details) {
      if (detail.uid) {
        await confirmReturnOrderShipmentApi(row.uid, { detailUid: detail.uid });
      }
    }
    message("确认发货成功", { type: "success" });
    getList();
  } catch (error) {
    handleApiError(error, "确认发货失败");
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
      <PureTableBar title="采购退货单" @refresh="getList">
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
            :columns="returnOrderColumns"
            border
            :data="dataList"
            :loading="loading"
            show-overflow-tooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handlePageChange"
          >
            <template #operation="{ row }">
              <TableOperationsWithCustomization
                :row="row"
                show-audit
                :delete-title="`确认删除编号 ${row.number} 的退货单?`"
                :custom-actions="
                  [
                    {
                      label: '确认发货',
                      type: 'success',
                      visible: row.isApproved && row.logisticsStatus === 0,
                      onClick: () => handleConfirmShipment(row)
                    },
                    {
                      label: '退款',
                      type: 'warning',
                      visible: row.isApproved,
                      onClick: () => openDialog('退款', row)
                    }
                  ] as CustomAction[]
                "
                @view="openDialog('查看', $event)"
                @edit="openDialog('修改', $event)"
                @audit="openDialog('审核', $event)"
                @delete="handleDelete"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

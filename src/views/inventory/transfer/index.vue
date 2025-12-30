<script setup lang="ts">
import { h, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import type { FormInstance } from "element-plus";
import { v7 as uuid } from "uuid";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import View from "~icons/ep/view";
import Delete from "~icons/ep/delete";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { columns } from "./columns";
import editForm from "./form.vue";
import type { TransferOrder, TransferOrderQuery } from "./types";
import { getAuditStatus, getLogisticsStatus } from "./types";
import {
  addOrderApi,
  confirmTransferOrderArrivalApi,
  confirmTransferOrderShipmentApi,
  deleteOrderApi,
  getCompanyId,
  getOrderListApi,
  updateOrderApi
} from "@/api";
import { ALL_LIST, handleApiError, localForage, message } from "@/utils";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "InventoryTransfer"
});

const ORDER_TYPE = "transfer-order";

const dataList = ref<TransferOrder[]>([]);
const loading = ref(false);
const formRef = ref<FormInstance>();
const editFormRef = ref<{
  getRef: () => FormInstance;
  getFormData: () => any;
}>();

const repoList = ref<Array<{ uid: string; name: string }>>([]);
const managerList = ref<Array<{ uid: string; name: string }>>([]);

const queryParams = reactive<
  TransferOrderQuery & { auditStatus?: "PENDING" | "APPROVED" | "REJECTED" }
>({
  fromRepositoryId: "",
  toRepositoryId: "",
  auditorId: "",
  keyword: "",
  auditStatus: undefined
});

const pagination = reactive({
  total: 0,
  pageSize: 15,
  currentPage: 1,
  background: true
});

async function loadSelectData() {
  const [repos, managers] = await Promise.all([
    localForage().getItem(ALL_LIST.repo),
    localForage().getItem(ALL_LIST.manager)
  ]);
  repoList.value = (repos as Array<{ uid: string; name: string }>) || [];
  managerList.value = (managers as Array<{ uid: string; name: string }>) || [];
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await getOrderListApi(ORDER_TYPE, pagination.currentPage, {
      ...(queryParams.fromRepositoryId
        ? { fromRepositoryId: queryParams.fromRepositoryId }
        : {}),
      ...(queryParams.toRepositoryId
        ? { toRepositoryId: queryParams.toRepositoryId }
        : {}),
      ...(queryParams.auditorId ? { auditorId: queryParams.auditorId } : {})
    } as any);

    if (res.code !== 200) {
      message(res.msg || "获取调拨单列表失败", { type: "error" });
      dataList.value = [];
      pagination.total = 0;
      return;
    }

    let list = (res.data?.list || []) as TransferOrder[];

    if (queryParams.auditStatus) {
      list = list.filter(
        row => getAuditStatus(row) === queryParams.auditStatus
      );
    }
    if (queryParams.keyword) {
      const kw = queryParams.keyword.trim();
      list = list.filter(row => {
        const billNo = row.docNo || row.number || row.uid;
        return (
          String(billNo).includes(kw) ||
          String(row.desc || "").includes(kw) ||
          String(row.rejectReason || "").includes(kw)
        );
      });
    }

    dataList.value = list;
    pagination.total = res.data?.count ?? 0;
  } catch (error) {
    handleApiError(error, "获取调拨单列表失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.currentPage = 1;
  fetchData();
}

function handleReset(formEl: FormInstance | undefined) {
  if (formEl) formEl.resetFields();
  queryParams.fromRepositoryId = "";
  queryParams.toRepositoryId = "";
  queryParams.auditorId = "";
  queryParams.keyword = "";
  queryParams.auditStatus = undefined;
  handleSearch();
}

function handleCurrentChange(page: number) {
  pagination.currentPage = page;
  fetchData();
}

function openDialog(title: string, row?: TransferOrder, isView = false) {
  const isCreate = !row;
  const formInline: Partial<TransferOrder> = row
    ? { ...row }
    : {
        uid: uuid(),
        fromRepositoryId: "",
        toRepositoryId: "",
        auditorId: "",
        desc: "",
        isApproved: false,
        isLocked: false,
        details: []
      };

  addDialog({
    title,
    props: {
      formInline,
      isView,
      isCreate
    },
    width: "70%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(editForm, { ref: editFormRef }),
    beforeSure: async done => {
      if (isView) {
        done();
        return;
      }
      const formInstance = editFormRef.value?.getRef();
      if (!formInstance) return;

      await formInstance.validate(async (valid: boolean) => {
        if (!valid) return;

        try {
          const companyId = await getCompanyId();
          const operatorId = useUserStoreHook().uid;
          if (!operatorId) {
            message("用户信息缺失，请重新登录后再试", { type: "error" });
            return;
          }

          const data = editFormRef.value?.getFormData();
          const details = (data.details || []) as Array<{
            tireId: string;
            count: number;
          }>;

          if (isCreate) {
            if (details.length === 0) {
              message("请添加商品明细", { type: "warning" });
              return;
            }

            await addOrderApi(ORDER_TYPE, {
              order: {
                uid: formInline.uid,
                company: { connect: { uid: companyId } },
                operator: { connect: { uid: operatorId } },
                auditor: { connect: { uid: data.auditorId } },
                fromRepository: { connect: { uid: data.fromRepositoryId } },
                toRepository: { connect: { uid: data.toRepositoryId } },
                desc: data.desc || null,
                isApproved: false,
                isLocked: false
              },
              details: details.map(d => ({
                companyId,
                number: uuid(),
                tireId: d.tireId,
                count: d.count,
                isShipped: false,
                isArrival: false
              }))
            } as any);
            message("创建成功", { type: "success" });
          } else if (row?.uid) {
            await updateOrderApi(ORDER_TYPE, row.uid, {
              auditor: { connect: { uid: data.auditorId } },
              fromRepository: { connect: { uid: data.fromRepositoryId } },
              toRepository: { connect: { uid: data.toRepositoryId } },
              desc: data.desc || null,
              company: { connect: { uid: companyId } }
            } as any);
            message("更新成功", { type: "success" });
          }

          done();
          fetchData();
        } catch (error) {
          handleApiError(error, "操作失败");
        }
      });
    }
  });
}

async function handleDelete(row: TransferOrder) {
  try {
    await ElMessageBox.confirm("确认删除该调拨单?", "确认删除", {
      type: "warning"
    });
    await deleteOrderApi(ORDER_TYPE, row.uid);
    message("删除成功", { type: "success" });
    fetchData();
  } catch (error) {
    if (error !== "cancel") handleApiError(error, "删除失败");
  }
}

async function handleApprove(row: TransferOrder) {
  try {
    await ElMessageBox.confirm(
      "审核后将允许进行发货/到货确认，确认审核通过?",
      "确认审核",
      { type: "warning" }
    );
    const companyId = await getCompanyId();
    await updateOrderApi(ORDER_TYPE, row.uid, {
      company: { connect: { uid: companyId } },
      isApproved: true,
      isLocked: true,
      rejectReason: null,
      auditAt: new Date().toISOString()
    } as any);
    message("审核成功", { type: "success" });
    fetchData();
  } catch (error) {
    if (error !== "cancel") handleApiError(error, "审核失败");
  }
}

async function handleReject(row: TransferOrder) {
  try {
    const { value } = await ElMessageBox.prompt("请输入拒绝原因", "拒绝审核", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "请输入拒绝原因"
    });
    const companyId = await getCompanyId();
    await updateOrderApi(ORDER_TYPE, row.uid, {
      company: { connect: { uid: companyId } },
      isApproved: false,
      isLocked: false,
      rejectReason: value,
      auditAt: null
    } as any);
    message("已拒绝", { type: "success" });
    fetchData();
  } catch (error) {
    if (error !== "cancel") handleApiError(error, "操作失败");
  }
}

async function handleConfirmShipment(row: TransferOrder) {
  const pending = (row.details || []).filter(d => !d.isShipped);
  if (pending.length === 0) {
    message("已全部发货", { type: "info" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      "确认发货后将变更库存状态，是否继续?",
      "确认发货",
      {
        type: "warning"
      }
    );
    for (const detail of pending) {
      if (detail.uid) {
        await confirmTransferOrderShipmentApi(row.uid, {
          detailUid: detail.uid
        });
      }
    }
    message("确认发货成功", { type: "success" });
    fetchData();
  } catch (error) {
    if (error !== "cancel") handleApiError(error, "确认发货失败");
  }
}

async function handleConfirmArrival(row: TransferOrder) {
  const pending = (row.details || []).filter(d => d.isShipped && !d.isArrival);
  if (pending.length === 0) {
    message("已全部到货", { type: "info" });
    return;
  }
  try {
    await ElMessageBox.confirm("确认到货后将入库，是否继续?", "确认到货", {
      type: "warning"
    });
    for (const detail of pending) {
      if (detail.uid) {
        await confirmTransferOrderArrivalApi(row.uid, {
          detailUid: detail.uid
        });
      }
    }
    message("确认到货成功", { type: "success" });
    fetchData();
  } catch (error) {
    if (error !== "cancel") handleApiError(error, "确认到货失败");
  }
}

onMounted(async () => {
  await loadSelectData();
  fetchData();
});
</script>

<template>
  <div class="main">
    <el-card class="mb-4">
      <el-form ref="formRef" :model="queryParams" :inline="true">
        <el-form-item label="调出仓库" prop="fromRepositoryId">
          <el-select
            v-model="queryParams.fromRepositoryId"
            placeholder="请选择调出仓库"
            clearable
            filterable
            class="w-[180px]"
          >
            <el-option
              v-for="item in repoList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调入仓库" prop="toRepositoryId">
          <el-select
            v-model="queryParams.toRepositoryId"
            placeholder="请选择调入仓库"
            clearable
            filterable
            class="w-[180px]"
          >
            <el-option
              v-for="item in repoList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审核人" prop="auditorId">
          <el-select
            v-model="queryParams.auditorId"
            placeholder="请选择审核人"
            clearable
            filterable
            class="w-[160px]"
          >
            <el-option
              v-for="item in managerList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态" prop="auditStatus">
          <el-select
            v-model="queryParams.auditStatus"
            placeholder="请选择"
            clearable
            class="w-[140px]"
          >
            <el-option label="待审核" value="PENDING" />
            <el-option label="已审核" value="APPROVED" />
            <el-option label="已拒绝" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="单号/备注/拒绝原因"
            clearable
            class="w-[200px]"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="handleSearch"
          >
            搜索
          </el-button>
          <el-button
            :icon="useRenderIcon(Refresh)"
            @click="handleReset(formRef)"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <PureTableBar title="调拨单列表" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增调拨单')"
          >
            新增调拨单
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="uid"
            adaptive
            :size="size"
            :columns="columns"
            border
            :data="dataList"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                link
                type="primary"
                :icon="useRenderIcon(View)"
                @click="openDialog('查看调拨单', row, true)"
              >
                查看
              </el-button>
              <el-button
                v-if="!row.isLocked"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('编辑调拨单', row, false)"
              >
                编辑
              </el-button>
              <el-button
                v-if="!row.isApproved && !row.isLocked"
                link
                type="success"
                @click="handleApprove(row)"
              >
                审核
              </el-button>
              <el-button
                v-if="!row.isApproved && !row.isLocked"
                link
                type="warning"
                @click="handleReject(row)"
              >
                拒绝
              </el-button>
              <el-button
                v-if="
                  row.isApproved && getLogisticsStatus(row) === 'PENDING_SHIP'
                "
                link
                type="success"
                @click="handleConfirmShipment(row)"
              >
                确认发货
              </el-button>
              <el-button
                v-if="row.isApproved && getLogisticsStatus(row) === 'SHIPPED'"
                link
                type="success"
                @click="handleConfirmArrival(row)"
              >
                确认到货
              </el-button>
              <el-button
                v-if="!row.isLocked"
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  purchaseOrderColumns,
  saleOrderColumns,
  claimOrderColumns,
  returnOrderColumns,
  wasteOrderColumns,
  transferOrderColumns,
  assemblyOrderColumns
} from "./props";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import { openDialog } from "./table";
import {
  getOrderListApi,
  deleteOrderApi,
  getEmployeeListApi,
  getAuditorListApi,
  getRepoListApi,
  getTireListApi,
  getProviderListApi,
  confirmPurchaseOrderArrivalApi,
  confirmSaleOrderShipmentApi,
  confirmSaleOrderDeliveryApi,
  processClaimOrderPaymentApi,
  confirmReturnOrderCustomerArrivalApi,
  confirmReturnOrderProviderShipmentApi,
  confirmReturnOrderProviderDeliveryApi,
  refundReturnOrderApi,
  confirmTransferOrderShipmentApi,
  confirmTransferOrderArrivalApi
} from "@/api";
import {
  ALL_LIST,
  CUR_FORM_TITLE,
  CUR_ORDER_TYPE,
  getOrderTypeList,
  localForage,
  message,
  ORDER_TYPE
} from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "tire"
});
const dataList = ref([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  operatorId: undefined,
  auditorId: undefined,
  desc: undefined
});
const orderType = ref("");
const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const columns = ref([]);
const employeeList = ref([]);
const userRoles = useUserStoreHook().roles;
const orderTypeList = ref(getOrderTypeList(userRoles));

const getOrderListInfo = async () => {
  if (orderType.value === "") return;
  const { data, code, msg } = await getOrderListApi(
    orderType.value,
    pagination.value.currentPage
  );
  if (code === 200) {
    dataList.value = data.list;
    pagination.value.total = data.count;
  } else message(msg, { type: "error" });
};

const getAllEmployeeList = async () => {
  // const depWithEmp: any[] = await localForage().getItem("dep-w-emp");
  // depWithEmp.map(item => {
  //   item.employees.map(el => {
  //     employeeList.value.push({
  //       label: item.name + "-" + el.name,
  //       value: el.uid
  //     });
  //   });
  // });
  const { data, code, msg } = await getEmployeeListApi(0);
  if (code === 200) {
    employeeList.value = data;
    await localForage().setItem(ALL_LIST.employee, data);
  } else message(msg, { type: "error" });
};
const managerList = ref([]);
const allRepoList = ref([]);
const allTireList = ref([]);
const allCustomerList = ref([]);
const allProviderList = ref([]);
const getAllRepoList = async () => {
  const { data, code, msg } = await getRepoListApi(0);
  if (code === 200) {
    allRepoList.value = data;
    await localForage().setItem(ALL_LIST.repo, data);
  } else message(msg, { type: "error" });
};

const getAllCustomerList = async () => {
  const { data, code, msg } = await getTireListApi(0);
  if (code === 200) {
    allCustomerList.value = data;
    await localForage().setItem(ALL_LIST.customer, data);
  } else message(msg, { type: "error" });
};

const getAllProviderList = async () => {
  const { data, code, msg } = await getProviderListApi(0);
  if (code === 200) {
    allProviderList.value = data;
    await localForage().setItem(ALL_LIST.provider, data);
  } else message(msg, { type: "error" });
};

const getAllTireList = async () => {
  const { data, code, msg } = await getTireListApi(0);
  if (code === 200) {
    allTireList.value = data;
    await localForage().setItem(ALL_LIST.tire, data);
  } else message(msg, { type: "error" });
};
const getManagerList = async () => {
  if (orderType.value === ORDER_TYPE.default) return;
  const { data, code, msg } = await getAuditorListApi(orderType.value);
  if (code === 200) {
    managerList.value = data;
    await localForage().setItem(ALL_LIST.manager, data);
  } else message(msg, { type: "error" });
};
const onSearch = async () => {
  loading.value = true;
  const { data, code, msg } = await getOrderListApi(
    orderType.value,
    pagination.value.currentPage,
    form.value
  );

  if (code === 200) {
    dataList.value = data.list;
    pagination.value.total = data.count;
  } else message(msg, { type: "error" });
  loading.value = false;
};

const formTitle = ref("");

const handleOpenDialog = async (title, type, row) => {
  formTitle.value = title;
  await localForage().setItem(CUR_FORM_TITLE, title);
  openDialog(title, type, row);
};

const resetForm = formEl => {
  loading.value = true;
  if (!formEl) return;
  formEl.resetFields();
  loading.value = false;
};
const columnMapping = {
  [ORDER_TYPE.purchase]: purchaseOrderColumns,
  [ORDER_TYPE.sale]: saleOrderColumns,
  [ORDER_TYPE.claim]: claimOrderColumns,
  [ORDER_TYPE.return]: returnOrderColumns,
  [ORDER_TYPE.waste]: wasteOrderColumns,
  [ORDER_TYPE.transfer]: transferOrderColumns,
  [ORDER_TYPE.assembly]: assemblyOrderColumns
};

const setOrderType = async () => {
  try {
    const type = orderType.value;
    await localForage().setItem(CUR_ORDER_TYPE, type);
    columns.value = columnMapping[orderType.value] || columns.value;
    await onSearch();
  } catch (e) {
    throw new Error("fail to set order type for", e.message);
  }
};

async function getOrderType() {
  const curOrderType: string = await localForage().getItem(CUR_ORDER_TYPE);
  if (curOrderType) {
    orderType.value = curOrderType;
    await setOrderType();
  }
}

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getOrderListInfo();
}

async function handleDelete(row) {
  await deleteOrderApi(orderType.value, row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  await onSearch();
}

// 采购订单：确认到货
async function handleConfirmPurchaseArrival(row) {
  try {
    await confirmPurchaseOrderArrivalApi(row.uid, {});
    message("确认到货成功", { type: "success" });
    await onSearch();
  } catch (error) {
    message(error.message || "确认到货失败", { type: "error" });
  }
}

// 销售订单：确认发货
async function handleConfirmSaleShipment(row) {
  try {
    await confirmSaleOrderShipmentApi(row.uid, {});
    message("确认发货成功", { type: "success" });
    await onSearch();
  } catch (error) {
    message(error.message || "确认发货失败", { type: "error" });
  }
}

// 销售订单：确认送达
async function handleConfirmSaleDelivery(row) {
  try {
    await confirmSaleOrderDeliveryApi(row.uid, {});
    message("确认送达成功", { type: "success" });
    await onSearch();
  } catch (error) {
    message(error.message || "确认送达失败", { type: "error" });
  }
}

// 理赔订单：处理理赔费用
async function handleProcessClaimPayment(row) {
  handleOpenDialog("处理理赔费用", orderType.value, row);
}

// 退货订单：确认客户退货到货
async function handleConfirmReturnCustomerArrival(row) {
  try {
    await confirmReturnOrderCustomerArrivalApi(row.uid, {});
    message("确认客户退货到货成功", { type: "success" });
    await onSearch();
  } catch (error) {
    message(error.message || "确认客户退货到货失败", { type: "error" });
  }
}

// 退货订单：确认退供应商发货
async function handleConfirmReturnProviderShipment(row) {
  try {
    await confirmReturnOrderProviderShipmentApi(row.uid, {});
    message("确认退供应商发货成功", { type: "success" });
    await onSearch();
  } catch (error) {
    message(error.message || "确认退供应商发货失败", { type: "error" });
  }
}

// 退货订单：确认退供应商送达
async function handleConfirmReturnProviderDelivery(row) {
  try {
    await confirmReturnOrderProviderDeliveryApi(row.uid, {});
    message("确认退供应商送达成功", { type: "success" });
    await onSearch();
  } catch (error) {
    message(error.message || "确认退供应商送达失败", { type: "error" });
  }
}

// 退货订单：退款
async function handleRefundReturnOrder(row) {
  handleOpenDialog("退款", orderType.value, row);
}

// 调拨订单：确认发货
async function handleConfirmTransferShipment(row) {
  try {
    await confirmTransferOrderShipmentApi(row.uid, {});
    message("确认发货成功", { type: "success" });
    await onSearch();
  } catch (error) {
    message(error.message || "确认发货失败", { type: "error" });
  }
}

// 调拨订单：确认到货
async function handleConfirmTransferArrival(row) {
  try {
    await confirmTransferOrderArrivalApi(row.uid, {});
    message("确认到货成功", { type: "success" });
    await onSearch();
  } catch (error) {
    message(error.message || "确认到货失败", { type: "error" });
  }
}

// async function handleToggleOrder(row) {
//   await toggleOrderApi(row.uid);
//   onSearch();
// }

onMounted(async () => {
  await getOrderType();
  await Promise.all([
    getOrderListInfo(),
    getAllEmployeeList(),
    getAllRepoList(),
    getManagerList(),
    getAllTireList(),
    getAllCustomerList(),
    getAllProviderList()
  ]);
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-radio-group v-model="orderType" @change="setOrderType">
        <el-radio-button
          v-for="item in orderTypeList"
          :key="item.value"
          :value="item.value"
          >{{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <el-card class="m-1">
      <el-form
        ref="formRef"
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="操作人：" prop="operatorId">
          <el-select
            v-model="form.operatorId"
            placeholder="请选择操作人"
            clearable
            class="w-[180px]!"
          >
            <el-option
              v-for="item in employeeList"
              :key="item.id"
              :label="item.name"
              :value="item.uid"
            >
              <div>{{ item.nickname }}-{{ item.name }}</div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="审核人：" prop="auditorId">
          <el-select
            v-model="form.auditorId"
            placeholder="请选择审核人"
            clearable
            class="w-[180px]!"
          >
            <el-option
              v-for="item in managerList"
              :key="item.id"
              :label="item.name"
              :value="item.uid"
            >
              {{ item.name }}
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="备注：" prop="desc">
          <el-input
            v-model="form.desc"
            placeholder="请输入备注"
            clearable
            class="w-[180px]!"
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
          <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="getOrderListInfo">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="handleOpenDialog('新增', orderType, undefined)"
          >
            新增订单
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
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
                @click="handleOpenDialog('查看', orderType, row)"
              >
                查看
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="handleOpenDialog('审核', orderType, row)"
              >
                审核
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="handleOpenDialog('更新状态', orderType, row)"
              >
                {{ row.status ? "关闭" : "开启" }}
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="handleOpenDialog('更新物流', orderType, row)"
              >
                更新物流
              </el-button>

              <el-button
                v-if="
                  orderType === ORDER_TYPE.purchase ||
                  orderType === ORDER_TYPE.sale ||
                  orderType === ORDER_TYPE.return
                "
                class="reset-margin"
                link
                type="primary"
                @click="
                  handleOpenDialog(
                    orderType === ORDER_TYPE.sale ? '收款' : '付款',
                    orderType,
                    row
                  )
                "
              >
                {{ orderType === ORDER_TYPE.sale ? "收款" : "付款" }}
              </el-button>

              <!-- 采购订单：确认到货 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.purchase && row.isApproved === true
                "
                class="reset-margin"
                link
                type="success"
                @click="handleConfirmPurchaseArrival(row)"
              >
                确认到货
              </el-button>

              <!-- 销售订单：确认发货 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.sale &&
                  row.isApproved === true &&
                  row.logisticsStatus === 0
                "
                class="reset-margin"
                link
                type="success"
                @click="handleConfirmSaleShipment(row)"
              >
                确认发货
              </el-button>

              <!-- 销售订单：确认送达 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.sale &&
                  row.isApproved === true &&
                  row.logisticsStatus === 1
                "
                class="reset-margin"
                link
                type="success"
                @click="handleConfirmSaleDelivery(row)"
              >
                确认送达
              </el-button>

              <!-- 理赔订单：处理理赔费用 -->
              <el-button
                v-if="orderType === ORDER_TYPE.claim && row.isApproved === true"
                class="reset-margin"
                link
                type="warning"
                @click="handleProcessClaimPayment(row)"
              >
                处理理赔费用
              </el-button>

              <!-- 退货订单：确认客户退货到货 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.return &&
                  row.isApproved === true &&
                  row.customerId
                "
                class="reset-margin"
                link
                type="success"
                @click="handleConfirmReturnCustomerArrival(row)"
              >
                确认客户退货到货
              </el-button>

              <!-- 退货订单：确认退供应商发货 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.return &&
                  row.isApproved === true &&
                  row.providerId
                "
                class="reset-margin"
                link
                type="success"
                @click="handleConfirmReturnProviderShipment(row)"
              >
                确认退供应商发货
              </el-button>

              <!-- 退货订单：确认退供应商送达 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.return &&
                  row.isApproved === true &&
                  row.providerId &&
                  row.logisticsStatus === 1
                "
                class="reset-margin"
                link
                type="success"
                @click="handleConfirmReturnProviderDelivery(row)"
              >
                确认退供应商送达
              </el-button>

              <!-- 退货订单：退款 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.return && row.isApproved === true
                "
                class="reset-margin"
                link
                type="warning"
                @click="handleRefundReturnOrder(row)"
              >
                退款
              </el-button>

              <!-- 调拨订单：确认发货 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.transfer &&
                  row.isApproved === true &&
                  row.logisticsStatus === 0
                "
                class="reset-margin"
                link
                type="success"
                @click="handleConfirmTransferShipment(row)"
              >
                确认发货
              </el-button>

              <!-- 调拨订单：确认到货 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.transfer &&
                  row.isApproved === true &&
                  row.logisticsStatus === 1
                "
                class="reset-margin"
                link
                type="success"
                @click="handleConfirmTransferArrival(row)"
              >
                确认到货
              </el-button>

              <el-button
                v-if="row.isLocked === false"
                class="reset-margin"
                link
                type="primary"
                @click="handleOpenDialog('修改', orderType, row)"
              >
                修改
              </el-button>

              <el-popconfirm
                v-if="row.isLocked === false"
                :title="`是否确认删除${row.name}这条数据`"
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
  </div>
</template>

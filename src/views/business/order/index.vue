<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import { getOrderTypeList, message, ORDER_TYPE } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useUserStoreHook } from "@/store/modules/user";
import { useOrderList, useOrderData, useOrderActions } from "./composables";

defineOptions({
  name: "Order"
});

// 用户角色和订单类型列表
const userRoles = useUserStoreHook().roles;
const orderTypeList = ref(getOrderTypeList(userRoles ?? []));
const formRef = ref();

// 使用 composables
const {
  dataList,
  loading,
  orderType,
  columns,
  form,
  pagination,
  getOrderListInfo,
  onSearch,
  setOrderType,
  getOrderType,
  handleCurrentChange,
  resetForm
} = useOrderList();

const { employeeList, managerList, loadAllData } = useOrderData(orderType);

const {
  handleOpenDialog,
  handleDelete,
  handleConfirmPurchaseArrival,
  handleConfirmSaleShipment,
  handleConfirmSaleDelivery,
  handleProcessClaimPayment,
  handleConfirmReturnCustomerArrival,
  handleConfirmReturnProviderShipment,
  handleConfirmReturnProviderDelivery,
  handleRefundReturnOrder,
  handleConfirmTransferShipment,
  handleConfirmTransferArrival,
  handleReverseOrder,
  handleSendInquiry,
  handleConvertQuotation
} = useOrderActions(orderType, onSearch);

onMounted(async () => {
  await getOrderType();
  await Promise.all([getOrderListInfo(), loadAllData()]);
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

              <!-- 采购计划：生成订单 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.purchasePlan &&
                  row.status !== 'ordered'
                "
                class="reset-margin"
                link
                type="primary"
                @click="message('功能开发中', { type: 'info' })"
              >
                生成订单
              </el-button>

              <!-- 采购询价：发送询价 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.purchaseInquiry &&
                  row.status === 'draft'
                "
                class="reset-margin"
                link
                type="primary"
                @click="handleSendInquiry(row)"
              >
                发送询价
              </el-button>

              <!-- 销售报价：转订单 -->
              <el-button
                v-if="
                  orderType === ORDER_TYPE.saleQuotation &&
                  row.status === 'accepted'
                "
                class="reset-margin"
                link
                type="success"
                @click="handleConvertQuotation(row)"
              >
                转订单
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

              <!-- 订单作废 -->
              <el-button
                v-if="
                  row.isApproved === true &&
                  !row.isReversed &&
                  orderType !== ORDER_TYPE.assembly &&
                  orderType !== ORDER_TYPE.transfer
                "
                class="reset-margin"
                link
                type="danger"
                @click="handleReverseOrder(row)"
              >
                作废
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

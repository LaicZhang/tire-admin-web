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
import Refresh from "@iconify-icons/ep/refresh";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import AddFill from "@iconify-icons/ri/add-circle-line";
import { openDialog } from "./table";
import { getOrderListApi, deleteOrderApi } from "@/api";
import { getOrderTypeList, localForage, message, ORDER_TYPE } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "tire"
});
const dataList = ref([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
  operatorId: "",
  auditorId: "",
  desc: ""
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
  if (code === 200) dataList.value = data.list;
  else message(msg, { type: "error" });
  pagination.value.total = data.count;
};

const getEmployeeList = async () => {
  const depWithEmp = await localForage().getItem("dep-w-emp");
  console.log("depWithEmp", depWithEmp);
  depWithEmp.map(item => {
    item.employees.map(el => {
      employeeList.value.push({
        label: item.name + "-" + el.name,
        value: el.uid
      });
    });
  });
};
const onSearch = async () => {
  loading.value = true;

  const { data, code, msg } = await getOrderListApi(
    orderType.value,
    pagination.value.currentPage,
    {
      desc: form.value.desc
    }
  );

  if (code === 200) {
    dataList.value = data.list;
    pagination.value.total = data.count;
  } else message(msg, { type: "error" });
  loading.value = false;
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
    console.log("setOrderType", orderType.value);
    await localForage().setItem("curOrderType", orderType.value);
    columns.value = columnMapping[orderType.value] || columns.value;
    await onSearch();
  } catch (e) {
    throw new Error("fail to set order type for", e.message);
  }
};

async function getOrderType() {
  const curOrderType: string = await localForage().getItem("curOrderType");
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

// async function handleToggleOrder(row) {
//   await toggleOrderApi(row.uid);
//   onSearch();
// }

onMounted(async () => {
  await Promise.all([getOrderType(), getOrderListInfo(), getEmployeeList()]);
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
        class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto"
      >
        <el-form-item label="操作人：" prop="operatorId">
          <el-select
            v-model="form.operatorId"
            placeholder="请选择操作人"
            clearable
            class="!w-[180px]"
          >
            <el-option
              v-for="item in employeeList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="审核人：" prop="auditorId">
          <el-select
            v-model="form.auditorId"
            placeholder="请选择审核人"
            clearable
            class="!w-[180px]"
          >
            <el-option
              v-for="item in employeeList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="备注：" prop="desc">
          <el-input
            v-model="form.desc"
            placeholder="请输入备注"
            clearable
            class="!w-[180px]"
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
            @click="openDialog('新增', orderType)"
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
                @click="openDialog('查看', orderType, row)"
              >
                查看
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('审核', orderType, row)"
              >
                审核
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('更新状态', orderType, row)"
              >
                {{ row.status === true ? "关闭" : "开启" }}
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('更新物流', orderType, row)"
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
                  openDialog(
                    orderType === ORDER_TYPE.sale ? '收款' : '付款',
                    orderType,
                    row
                  )
                "
              >
                {{ orderType === ORDER_TYPE.sale ? "收款" : "付款" }}
              </el-button>

              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('修改', orderType, row)"
              >
                修改
              </el-button>

              <el-popconfirm
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

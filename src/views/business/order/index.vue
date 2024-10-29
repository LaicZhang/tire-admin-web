<script setup lang="ts">
import { onMounted, ref } from "vue";
import { purchaseOrderColumns, saleOrderColumns } from "./props";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "@iconify-icons/ep/refresh";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import AddFill from "@iconify-icons/ri/add-circle-line";
import { openDialog } from "./table";
import { getOrderListApi, deleteOrderApi } from "@/api";
import { getOrderTypeList, message, ORDER_TYPE } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "tire"
});
const dataList = ref([]);
const loading = ref(false);
const formRef = ref();
const form = ref({
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
const curOrderType = ref("");
const orderTypeList = ref(getOrderTypeList(userRoles));

const getOrderListInfo = async () => {
  if (orderType.value === "") return;
  const res = await getOrderListApi(
    orderType.value,
    pagination.value.currentPage
  );
  if (res.code === 200) dataList.value = res.data.list;
  else message(res.message, { type: "error" });
  pagination.value.total = res.data.count;
};
const onSearch = async () => {
  curOrderType.value = orderType.value;
  loading.value = true;

  const { data } = await getOrderListApi(
    orderType.value,
    pagination.value.currentPage,
    {
      desc: form.value.desc
    }
  );

  dataList.value = data.list;
  pagination.value.total = data.count;
  loading.value = false;
};

const resetForm = formEl => {
  loading.value = true;
  if (!formEl) return;
  formEl.resetFields();
  loading.value = false;
};

const setOrderType = async () => {
  console.log("setOrderType", orderType.value);
  if (orderType.value === ORDER_TYPE.purchase) {
    columns.value = purchaseOrderColumns;
  } else if (orderType.value === ORDER_TYPE.sale) {
    columns.value = saleOrderColumns;
  }
  await onSearch();
};

async function handleCurrentChange(val: number) {
  pagination.value.currentPage = val;
  await getOrderListInfo();
}
async function handleDelete(row) {
  await deleteOrderApi(orderType.value, row.uid);
  message(`您删除了${row.name}这条数据`, { type: "success" });
  onSearch();
}
// async function handleToggleOrder(row) {
//   await toggleOrderApi(row.uid);
//   onSearch();
// }

onMounted(async () => {
  await getOrderListInfo();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-radio-group v-model="orderType" @change="setOrderType">
        <el-radio
          v-for="item in orderTypeList"
          :key="item.value"
          :value="item.value"
          >{{ item.label }}</el-radio
        >
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
        <template #buttons="{ row }">
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增', orderType, row)"
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
                  orderType === ORDER_TYPE.sale
                "
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('付款', row)"
              >
                {{ orderType === ORDER_TYPE.purchase ? "付款" : "收款" }}
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

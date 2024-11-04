<script setup lang="ts">
import { onMounted, ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";
import {
  PurchaseFormProps,
  purchaseOrderDeatailsColumns,
  saleOrderDeatailsColumns,
  SaleFormProps
} from "./props";
import { ALL_LIST, CUR_ORDER_TYPE, localForage } from "@/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "@iconify-icons/ep/refresh";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import AddFill from "@iconify-icons/ri/add-circle-line";

const props = withDefaults(defineProps<PurchaseFormProps | SaleFormProps>(), {
  formInline: () => ({
    uid: undefined,
    id: undefined,
    desc: undefined,
    operatorId: undefined,
    auditorId: undefined,
    warehouseEmployeeId: undefined,
    count: 0,
    total: 0,
    orderStatus: 0,
    logisticsStatus: 0,
    paidAmount: 0,
    isApproved: false,
    isLocked: false,
    rejectReason: undefined,
    paymentId: undefined,
    auditAt: null,
    arrivalAt: null,
    payAt: null,
    updateAt: null,
    providerId: undefined,
    customerId: undefined,
    details: []
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  auditorId: [{ required: true, message: "审核人为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

const orderType = ref("");
async function getOrderType() {
  const curOrderType: string = await localForage().getItem(CUR_ORDER_TYPE);
  if (curOrderType) {
    orderType.value = curOrderType;
  }
}
const dataList = ref([]);
const managerList = ref([]);
async function getManagerList() {
  managerList.value = await localForage().getItem(ALL_LIST.manager);
}
const detailsColumns = ref([]);
async function setDetailsColumns() {
  if (orderType.value === "purchase-order") {
    detailsColumns.value = purchaseOrderDeatailsColumns;
  } else if (orderType.value === "sale-order") {
    detailsColumns.value = saleOrderDeatailsColumns;
  }
  console.log(detailsColumns.value);
}

function onAdd() {
  dataList.value.push({
    index: dataList.value.length + 1,
    count: 1
  });
}
function onDel(row) {
  const index = dataList.value.indexOf(row);
  if (index !== -1) dataList.value.splice(index, 1);
}
function saveDataList() {
  newFormInline.value.details = dataList.value;
  console.log("newFormInline.value", newFormInline.value);
}
function clearDetails() {
  dataList.value = [];
}

const allRepoList = ref([]);
const allTireList = ref([]);
const allCustomerList = ref([]);
const allProviderList = ref([]);
async function getALlList() {
  allRepoList.value = await localForage().getItem(ALL_LIST.repo);
  allTireList.value = await localForage().getItem(ALL_LIST.tire);
  allCustomerList.value = await localForage().getItem(ALL_LIST.customer);
  allProviderList.value = await localForage().getItem(ALL_LIST.provider);
}

defineExpose({ getRef });
onMounted(async () => {
  await getOrderType();
  await getManagerList();
  await setDetailsColumns();
  await getALlList();
});
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item
      v-if="orderType === 'purchase-order'"
      label="供应商"
      prop="providerId"
    >
      <el-select
        v-model="newFormInline.providerId"
        clearable
        placeholder="请输入供应商"
      >
        <el-option
          v-for="item in allProviderList"
          :key="item.id"
          :label="item.name"
          :value="item.uid"
        >
          {{ item.name }}
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item
      v-if="orderType === 'sale-order'"
      label="客户"
      prop="customerId"
    >
      <el-select
        v-model="newFormInline.customerId"
        clearable
        placeholder="请输入客户"
      >
        <el-option
          v-for="item in allCustomerList"
          :key="item.id"
          :label="item.name"
          :value="item.uid"
        >
          {{ item.name }}
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="newFormInline.desc"
        placeholder="请输入备注信息"
        type="textarea"
      />
    </el-form-item>

    <el-form-item label="详情">
      <!-- <div>
        <el-button
          type="primary"
          class="float-right"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog('新增', orderType)"
        >
          新增
        </el-button>
      </div> -->
      <pure-table
        v-model="newFormInline.details"
        row-key="id"
        adaptive
        :columns="detailsColumns"
        border
        :data="dataList"
        showOverflowTooltip
      >
        <template #tireIdSelect="{ row }">
          <el-select v-model="row.tireId" placeholder="请选择轮胎" clearable>
            <el-option
              v-for="item in allTireList"
              :key="item.id"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </template>
        <template #repoIdSelect="{ row }">
          <el-select v-model="row.repoId" placeholder="请选择仓库" clearable>
            <el-option
              v-for="item in allRepoList"
              :key="item.id"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </template>
        <template #append>
          <el-button
            plain
            class="w-full my-2"
            :icon="useRenderIcon(AddFill)"
            @click="onAdd"
          >
            添加一行数据
          </el-button>
        </template>
        <template #operation="{ row }">
          <el-popconfirm
            :title="`是否确认删除${row.tireId}这条数据`"
            @confirm="onDel(row)"
          >
            <template #reference>
              <el-button
                class="reset-margin"
                :icon="useRenderIcon(Delete)"
                link
                type="danger"
              >
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </pure-table>
    </el-form-item>

    <div class="flex">
      <el-form-item label="审核人" prop="auditorId">
        <el-select
          v-model="newFormInline.auditorId"
          placeholder="请选择审核人"
          class="!w-[180px]"
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

      <el-form-item label="总价" prop="total">
        <el-input-number
          v-model="newFormInline.total"
          placeholder="请输入总价"
          class="!w-[180px]"
        />
      </el-form-item>

      <el-form-item label="总数" prop="count">
        <el-input-number
          v-model="newFormInline.count"
          placeholder="请输入总数"
          class="!w-[180px]"
        />
      </el-form-item>
    </div>
    <el-button type="primary" class="float-right ml-2" @click="saveDataList"
      >保存</el-button
    >
  </el-form>
</template>

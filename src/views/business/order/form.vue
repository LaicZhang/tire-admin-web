<script setup lang="ts">
import { onMounted, Ref, ref } from "vue";
import { PurchaseFormProps, SaleFormProps } from "./props";
import {
  ALL_LIST,
  CUR_ORDER_TYPE,
  localForage,
  message,
  ORDER_TYPE
} from "@/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import { getColumns, getFormRules } from "./handleData";
import { getFormTileInLocal } from "./table";

const props = withDefaults(defineProps<PurchaseFormProps | SaleFormProps>(), {
  formInline: () => ({
    number: undefined,
    uid: undefined,
    id: undefined,
    desc: undefined,
    operatorId: undefined,
    auditorId: undefined,
    warehouseEmployeeId: undefined,
    count: 0,
    total: 0,
    showTotal: 0,
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
const orderType: Ref<ORDER_TYPE> = ref();

const formRules = ref(getFormRules(orderType.value));

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
const formTitle = ref("新增");
function getRef() {
  return ruleFormRef.value;
}

async function getOrderType() {
  const curOrderType: ORDER_TYPE = await localForage().getItem(CUR_ORDER_TYPE);
  if (curOrderType) orderType.value = curOrderType;
  return orderType.value;
}

const managerList = ref([]);

const detailsColumns = ref([]);

function setDetailsColumnsAndFormRules() {
  detailsColumns.value = getColumns(orderType.value);
  formRules.value = getFormRules(orderType.value);
  if (!detailsColumns.value.length) {
    console.error("Unknown order type:", orderType.value);
  }
}

async function getFormTitle() {
  const title = await getFormTileInLocal();
  formTitle.value = title;
  if (formTitle.value) return formTitle.value;
}

function onAdd() {
  newFormInline.value.details.push({
    index: newFormInline.value.details.length + 1,
    count: 0,
    total: 0,
    tireId: undefined,
    isArrival: false
  });
}
function onDel(row) {
  const index = newFormInline.value.details.indexOf(row);
  if (index !== -1) newFormInline.value.details.splice(index, 1);
  const { count, total } = newFormInline.value;
  newFormInline.value.count = count - row.count;
  newFormInline.value.total = total - row.total;
  newFormInline.value.showTotal = newFormInline.value.total;
}

const allRepoList = ref([]);
const allTireList = ref([]);
const allCustomerList = ref([]);
const allProviderList = ref([]);
async function getALlList() {
  try {
    const [managerData, repoData, tireData, customerData, providerData] =
      (await Promise.all([
        localForage().getItem(ALL_LIST.manager),
        localForage().getItem(ALL_LIST.repo),
        localForage().getItem(ALL_LIST.tire),
        localForage().getItem(ALL_LIST.customer),
        localForage().getItem(ALL_LIST.provider)
      ])) as any[];

    managerList.value = managerData;
    allRepoList.value = repoData;
    allTireList.value = tireData;
    allCustomerList.value = customerData;
    allProviderList.value = providerData;
  } catch (error) {
    message(error.message, { type: "error" });
  }
}

async function getDisabled(arr: string[]) {
  return arr.includes(formTitle.value);
}
defineExpose({ getRef });
onMounted(async () => {
  await getOrderType();
  setDetailsColumnsAndFormRules();
  await getFormTitle();
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
    <div class="flex">
      <el-form-item
        v-if="[ORDER_TYPE.purchase].includes(orderType)"
        label="供应商"
        prop="providerId"
        :disabled="getDisabled(['修改', '新增'])"
      >
        <el-select
          v-model="newFormInline.providerId"
          clearable
          placeholder="请输入供应商"
          class="!w-[15vw]"
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
        v-if="[ORDER_TYPE.sale].includes(orderType)"
        label="客户"
        prop="customerId"
      >
        <el-select
          v-model="newFormInline.customerId"
          clearable
          placeholder="请选择客户"
          class="!w-[15vw]"
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

      <el-form-item label="审核人" prop="auditorId">
        <el-select
          v-model="newFormInline.auditorId"
          placeholder="请选择审核人"
          class="!w-[15vw]"
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
    </div>

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
        :data="newFormInline.details"
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

        <template #countInput="{ row }">
          <el-input-number
            v-model="row.count"
            :min="1"
            :max="100"
            :step="1"
            :step-strictly="true"
            controls-position="right"
            @change="
              () => {
                newFormInline.count = newFormInline.details.reduce(
                  (acc, cur) => acc + cur.count,
                  0
                );
              }
            "
          />
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
        <template v-if="['新增', '修改'].includes(formTitle)" #append>
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
              <div />
              <el-button
                v-if="['新增', '修改'].includes(formTitle)"
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
      <el-form-item label="总数" prop="count">
        <el-input-number
          v-model="newFormInline.count"
          disabled
          class="!w-[180px]"
        />
      </el-form-item>

      <el-form-item label="应付货款" prop="showTotal">
        <el-input-number
          v-model="newFormInline.showTotal"
          disabled
          class="!w-[180px]"
        />
      </el-form-item>

      <el-form-item label="实付货款" prop="total">
        <el-input-number v-model="newFormInline.total" class="!w-[180px]" />
      </el-form-item>

      <el-form-item label="已付货款" prop="paidAmount">
        <el-input-number
          v-model="newFormInline.paidAmount"
          class="!w-[180px]"
        />
      </el-form-item>
    </div>
  </el-form>
</template>

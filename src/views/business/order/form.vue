<script setup lang="ts">
import { onMounted, Ref, ref } from "vue";
import {
  PurchaseFormProps,
  SaleFormProps,
  ClaimFormProps,
  ReturnFormProps
} from "./props";
import {
  ALL_LIST,
  CUR_ORDER_TYPE,
  localForage,
  message,
  ORDER_TYPE
} from "@/utils";
import { getPaymentListApi, getCompanyId, scanBarcodeApi } from "@/api";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import SearchLine from "~icons/ri/search-line";
import { getColumns, getFormRules } from "./handleData";
import { getFormTileInLocal } from "./table";

const props = withDefaults(
  defineProps<
    PurchaseFormProps | SaleFormProps | ClaimFormProps | ReturnFormProps
  >(),
  {
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
      fee: 0,
      isReceive: false,
      details: [] as any
    })
  }
);
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
  if (formTitle.value === "确认到货" || formTitle.value === "新增") {
    // 确认到货时添加批次号和过期时间列
    // 新增时也可以允许录入(虽然逻辑上是到货才录入，但有时是一步到位)
    // 这里主要针对 '确认到货'
    if (formTitle.value === "确认到货") {
      detailsColumns.value = [
        ...detailsColumns.value,
        {
          label: "批次号",
          prop: "batchNo",
          slot: "batchNoInput"
        },
        {
          label: "过期时间",
          prop: "expiryDate",
          slot: "expiryDateInput"
        }
      ];
    }
  }
  if (!detailsColumns.value || !detailsColumns.value.length) {
    // 未知订单类型，静默处理
  }
}

async function getFormTitle() {
  const title = await getFormTileInLocal();
  formTitle.value = title;
  if (formTitle.value) return formTitle.value;
}

function onAdd(item?: any) {
  newFormInline.value.details.push({
    index: newFormInline.value.details.length + 1,
    count: item ? 1 : 0,
    total: 0,
    tireId: item ? item.uid : undefined,
    isArrival: false
  });
  if (item) {
    newFormInline.value.count += 1;
  }
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
const allPaymentList = ref([]);
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

    const cid = await getCompanyId();
    const { data: paymentData } = await getPaymentListApi(cid);
    allPaymentList.value = Array.isArray(paymentData)
      ? paymentData
      : paymentData.list;
  } catch (error) {
    message(error.message, { type: "error" });
  }
}

async function getDisabled(arr: string[]) {
  return arr.includes(formTitle.value);
}

// 条码扫描
const barcodeInput = ref("");
const barcodeLoading = ref(false);

async function handleScan() {
  const code = barcodeInput.value.trim();
  if (!code) return;

  try {
    barcodeLoading.value = true;
    const { data } = await scanBarcodeApi(code);
    if (data) {
      const existing = newFormInline.value.details.find(
        d => d.tireId === data.uid
      );
      if (existing) {
        existing.count = (existing.count || 0) + 1;
        newFormInline.value.count += 1;
        message(`已增加商品 [${data.name}] 数量`, { type: "success" });
      } else {
        // Find full info from local list if available, otherwise use API data mainly for UID
        // Using allTireList to verify it exists in local options too
        const inList = allTireList.value.find(t => t.uid === data.uid);
        if (!inList) {
          message(`商品 [${data.name}] 不在当前可选列表中`, {
            type: "warning"
          });
          // Still add it? Maybe better to warn.
          // If it's a valid product but not in "ALL_LIST.tire" cache, we might have issue.
          // But let's assume ALL_LIST is up to date or we trust the API result.
          onAdd(data);
          message(`已添加商品 [${data.name}]`, { type: "success" });
        } else {
          onAdd(inList);
          message(`已添加商品 [${inList.name}]`, { type: "success" });
        }
      }
      barcodeInput.value = ""; // Clear input on success
    } else {
      message("未找到对应条码的商品", { type: "warning" });
    }
  } catch (error) {
    message("扫码查询失败", { type: "error" });
  } finally {
    barcodeLoading.value = false;
  }
}

defineExpose({ getRef });
onMounted(async () => {
  await getOrderType();
  await getFormTitle(); // Move up to ensure title is ready before setting columns if we logic depends on it
  setDetailsColumnsAndFormRules();
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
          v-model="(newFormInline as any).providerId"
          clearable
          placeholder="请输入供应商"
          class="w-[15vw]!"
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
          v-model="(newFormInline as any).customerId"
          clearable
          placeholder="请选择客户"
          class="w-[15vw]!"
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
          class="w-[15vw]!"
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

    <!-- 审核相关字段 -->
    <template v-if="['审核'].includes(formTitle)">
      <el-form-item label="审核状态">
        <el-radio-group v-model="newFormInline.isApproved">
          <el-radio :label="true">通过</el-radio>
          <el-radio :label="false">拒绝</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="newFormInline.isApproved === false"
        label="拒绝原因"
        prop="rejectReason"
      >
        <el-input
          v-model="newFormInline.rejectReason"
          placeholder="请输入拒绝原因"
          type="textarea"
        />
      </el-form-item>
    </template>

    <!-- 支付相关字段 -->
    <template
      v-if="
        ['付款', '收款'].includes(formTitle) &&
        [ORDER_TYPE.purchase, ORDER_TYPE.sale].includes(orderType)
      "
    >
      <el-form-item label="支付金额" prop="total">
        <el-input-number
          v-model="newFormInline.total"
          :min="0"
          :precision="2"
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="支付账户" prop="paymentId">
        <el-select
          v-model="newFormInline.paymentId"
          placeholder="请选择支付账户"
          clearable
          class="w-[15vw]!"
        >
          <!-- 支付账户选项需要从API获取 -->
          <el-option
            v-for="item in allPaymentList"
            :key="item.uid"
            :label="item.name + ' (余额:' + (item.balance || 0) + ')'"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
    </template>

    <!-- 理赔费用相关字段 -->
    <template
      v-if="formTitle === '处理理赔费用' && orderType === ORDER_TYPE.claim"
    >
      <el-form-item label="费用金额" prop="fee">
        <el-input-number
          v-model="(newFormInline as any).fee"
          :min="0"
          :precision="2"
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="费用类型">
        <el-radio-group v-model="(newFormInline as any).isReceive">
          <el-radio :label="true">收到理赔金</el-radio>
          <el-radio :label="false">支付理赔金</el-radio>
        </el-radio-group>
      </el-form-item>
    </template>

    <!-- 退款相关字段 -->
    <template v-if="formTitle === '退款' && orderType === ORDER_TYPE.return">
      <el-form-item label="退款金额" prop="fee">
        <el-input-number
          v-model="(newFormInline as any).fee"
          :min="0"
          :precision="2"
          class="w-[180px]!"
        />
      </el-form-item>
    </template>

    <el-form-item label="详情">
      <!-- 扫码栏，仅在新增或修改时显示 -->
      <div
        v-if="['新增', '修改'].includes(formTitle)"
        class="mb-2 flex items-center"
      >
        <el-input
          v-model="barcodeInput"
          placeholder="扫描或输入条码添加商品 (回车)"
          class="w-[300px] mr-2"
          :prefix-icon="useRenderIcon(SearchLine)"
          :loading="barcodeLoading"
          @keyup.enter="handleScan"
        />
        <el-button
          type="primary"
          link
          :loading="barcodeLoading"
          @click="handleScan"
        >
          添加
        </el-button>
        <span class="text-gray-400 text-sm ml-2"
          >Tip: 聚焦输入框后使用扫码枪或手动输入条码按回车</span
        >
      </div>

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
          <el-select
            v-model="row.tireId"
            placeholder="请选择轮胎"
            clearable
            filterable
          >
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
                newFormInline.count = (
                  newFormInline.details as Array<{ count: number }>
                ).reduce((acc, cur) => acc + (cur.count || 0), 0);
              }
            "
          />
        </template>
        <template #batchNoInput="{ row }">
          <el-input v-model="row.batchNo" placeholder="请输入批次号" />
        </template>
        <template #expiryDateInput="{ row }">
          <el-date-picker
            v-model="row.expiryDate"
            type="date"
            placeholder="请选择过期时间"
            value-format="YYYY-MM-DD"
            class="w-full!"
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
            @click="onAdd()"
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
          class="w-[180px]!"
        />
      </el-form-item>

      <el-form-item label="应付货款" prop="showTotal">
        <el-input-number
          v-model="newFormInline.showTotal"
          disabled
          class="w-[180px]!"
        />
      </el-form-item>

      <el-form-item label="实付货款" prop="total">
        <el-input-number v-model="newFormInline.total" class="w-[180px]!" />
      </el-form-item>

      <el-form-item label="已付货款" prop="paidAmount">
        <el-input-number
          v-model="newFormInline.paidAmount"
          class="w-[180px]!"
        />
      </el-form-item>
    </div>
  </el-form>
</template>

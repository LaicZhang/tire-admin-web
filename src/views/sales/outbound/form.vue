<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { OutboundOrder, OutboundOrderDetail } from "./types";
import { outboundOrderDetailColumns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import { ALL_LIST, localForage, message } from "@/utils";
import { getPaymentListApi, getCompanyId } from "@/api";

const props = withDefaults(
  defineProps<{
    formInline: OutboundOrder;
    formTitle?: string;
  }>(),
  {
    formTitle: "新增"
  }
);

const ruleFormRef = ref<FormInstance>();
const formData = ref<OutboundOrder>(props.formInline);

const formRules: FormRules = {
  customerId: [{ required: true, message: "请选择客户", trigger: "change" }]
};

const allCustomerList = ref<any[]>([]);
const allTireList = ref<any[]>([]);
const allRepoList = ref<any[]>([]);
const managerList = ref<any[]>([]);
const allPaymentList = ref<any[]>([]);

const isReadOnly = computed(() => ["查看", "审核"].includes(props.formTitle));

const isEditable = computed(() => ["新增", "修改"].includes(props.formTitle));

async function loadBaseData() {
  try {
    const [customerData, tireData, repoData, managerData] = await Promise.all([
      localForage().getItem(ALL_LIST.customer),
      localForage().getItem(ALL_LIST.tire),
      localForage().getItem(ALL_LIST.repo),
      localForage().getItem(ALL_LIST.manager)
    ]);
    allCustomerList.value = (customerData as any[]) || [];
    allTireList.value = (tireData as any[]) || [];
    allRepoList.value = (repoData as any[]) || [];
    managerList.value = (managerData as any[]) || [];

    const cid = await getCompanyId();
    const { data: paymentData } = await getPaymentListApi(cid);
    allPaymentList.value = Array.isArray(paymentData)
      ? paymentData
      : paymentData?.list || [];
  } catch {
    message("加载基础数据失败", { type: "error" });
  }
}

function onAddDetail() {
  formData.value.details.push({
    tireId: "",
    count: 1,
    unitPrice: 0,
    total: 0,
    repoId: "",
    batchNo: "",
    isShipped: false,
    desc: ""
  });
}

function onDeleteDetail(index: number) {
  const detail = formData.value.details[index];
  formData.value.count -= detail.count || 0;
  formData.value.total -= detail.total || 0;
  formData.value.showTotal = formData.value.total;
  formData.value.details.splice(index, 1);
}

function calcDetailTotal(row: OutboundOrderDetail) {
  row.total = (row.count || 0) * (row.unitPrice || 0);
  recalcOrderTotal();
}

function recalcOrderTotal() {
  let totalCount = 0;
  let totalAmount = 0;
  formData.value.details.forEach(d => {
    totalCount += d.count || 0;
    totalAmount += d.total || 0;
  });
  formData.value.count = totalCount;
  formData.value.total = totalAmount;
  formData.value.showTotal = totalAmount;
}

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });

onMounted(() => {
  loadBaseData();
});

watch(
  () => props.formInline,
  val => {
    formData.value = val;
  },
  { deep: true }
);
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="formData"
    :rules="formRules"
    label-width="100px"
    class="outbound-order-form"
  >
    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="formData.customerId"
            placeholder="请选择客户"
            clearable
            filterable
            :disabled="isReadOnly || !!formData.saleOrderId"
            class="w-full"
          >
            <el-option
              v-for="item in allCustomerList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="审核人" prop="auditorId">
          <el-select
            v-model="formData.auditorId"
            placeholder="请选择审核人"
            clearable
            :disabled="isReadOnly"
            class="w-full"
          >
            <el-option
              v-for="item in managerList"
              :key="item.uid"
              :label="item.name"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="出库单号">
          <el-input v-model="formData.number" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="关联销售单">
          <el-input v-model="formData.saleOrderNumber" disabled />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="备注">
      <el-input
        v-model="formData.desc"
        type="textarea"
        :rows="2"
        placeholder="请输入备注信息"
        :disabled="isReadOnly"
      />
    </el-form-item>

    <template v-if="formTitle === '审核'">
      <el-divider>审核信息</el-divider>
      <el-form-item label="审核状态">
        <el-radio-group v-model="formData.isApproved">
          <el-radio :value="true">通过</el-radio>
          <el-radio :value="false">拒绝</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.isApproved === false" label="拒绝原因">
        <el-input
          v-model="formData.rejectReason"
          type="textarea"
          placeholder="请输入拒绝原因"
        />
      </el-form-item>
    </template>

    <template v-if="['收款'].includes(formTitle)">
      <el-divider>收款信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="本次收款" prop="paidAmount">
            <el-input-number
              v-model="formData.paidAmount"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="收款账户" prop="paymentId">
            <el-select
              v-model="formData.paymentId"
              placeholder="请选择收款账户"
              clearable
              class="w-full"
            >
              <el-option
                v-for="item in allPaymentList"
                :key="item.uid"
                :label="`${item.name} (余额: ${item.balance || 0})`"
                :value="item.uid"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <el-divider>出库明细</el-divider>

    <pure-table
      row-key="uid"
      :columns="outboundOrderDetailColumns"
      :data="formData.details"
      border
      adaptive
      show-overflow-tooltip
    >
      <template #tireIdSelect="{ row }">
        <el-select
          v-model="row.tireId"
          placeholder="选择商品"
          clearable
          filterable
          :disabled="isReadOnly"
        >
          <el-option
            v-for="item in allTireList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </template>

      <template #countInput="{ row }">
        <el-input-number
          v-model="row.count"
          :min="1"
          :max="9999"
          :disabled="isReadOnly"
          controls-position="right"
          @change="calcDetailTotal(row)"
        />
      </template>

      <template #unitPriceInput="{ row }">
        <el-input-number
          v-model="row.unitPrice"
          :min="0"
          :precision="2"
          :disabled="isReadOnly"
          controls-position="right"
          @change="calcDetailTotal(row)"
        />
      </template>

      <template #totalInput="{ row }">
        <el-input-number
          v-model="row.total"
          :min="0"
          :precision="2"
          disabled
          controls-position="right"
        />
      </template>

      <template #repoIdSelect="{ row }">
        <el-select
          v-model="row.repoId"
          placeholder="选择仓库"
          clearable
          :disabled="isReadOnly"
        >
          <el-option
            v-for="item in allRepoList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </template>

      <template #batchNoInput="{ row }">
        <el-input
          v-model="row.batchNo"
          placeholder="批次号"
          :disabled="isReadOnly"
        />
      </template>

      <template #isShippedSwitch="{ row }">
        <el-switch v-model="row.isShipped" disabled />
      </template>

      <template #descInput="{ row }">
        <el-input
          v-model="row.desc"
          placeholder="备注"
          :disabled="isReadOnly"
        />
      </template>

      <template #operation="{ $index }">
        <el-popconfirm title="确认删除此行?" @confirm="onDeleteDetail($index)">
          <template #reference>
            <el-button
              v-if="isEditable"
              link
              type="danger"
              :icon="useRenderIcon(Delete)"
            >
              删除
            </el-button>
          </template>
        </el-popconfirm>
      </template>

      <template v-if="isEditable" #append>
        <el-button
          plain
          class="w-full my-2"
          :icon="useRenderIcon(AddFill)"
          @click="onAddDetail"
        >
          添加出库明细
        </el-button>
      </template>
    </pure-table>

    <el-divider>金额汇总</el-divider>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="商品数量">
          <el-input-number v-model="formData.count" disabled class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="出库金额">
          <el-input-number
            v-model="formData.showTotal"
            disabled
            :precision="2"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="实收金额">
          <el-input-number
            v-model="formData.total"
            :precision="2"
            :disabled="isReadOnly"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="本次收款">
          <el-input-number
            v-model="formData.paidAmount"
            :precision="2"
            :disabled="isReadOnly"
            class="w-full"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

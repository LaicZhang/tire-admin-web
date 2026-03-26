<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type {
  ReturnableSource,
  SalesReturnOrder,
  SalesReturnDetail
} from "./types";
import { salesReturnDetailColumns } from "./columns";
import { RETURN_REASON_OPTIONS } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import { getSalesReturnableSourcesApi } from "@/api/sales";
import { ALL_LIST, handleApiError, localForage, message } from "@/utils";
import {
  formatSerialNumbersText,
  parseSerialNumbersText
} from "@/utils/serialNumber";
import CustomerSelect from "@/components/EntitySelect/CustomerSelect.vue";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";

const props = withDefaults(
  defineProps<{
    formInline: SalesReturnOrder;
    formTitle?: string;
  }>(),
  {
    formTitle: "新增"
  }
);

const ruleFormRef = ref<FormInstance>();
const formData = ref<SalesReturnOrder>(props.formInline);

const formRules: FormRules = {
  customerId: [{ required: true, message: "请选择客户", trigger: "change" }],
  returnReason: [
    { required: true, message: "请选择退货原因", trigger: "change" }
  ]
};

interface SelectItem {
  uid: string;
  name: string;
  balance?: number;
  id?: string;
  code?: string;
}

const allTireList = ref<SelectItem[]>([]);
const allRepoList = ref<SelectItem[]>([]);
const managerList = ref<SelectItem[]>([]);
const returnableSourceList = ref<ReturnableSource[]>([]);
const returnableSourceLoading = ref(false);

const returnReasonOptions = RETURN_REASON_OPTIONS;

const isReadOnly = computed(() => ["查看", "审核"].includes(props.formTitle));

const isEditable = computed(() => ["新增", "修改"].includes(props.formTitle));

function prepareDetail(detail: SalesReturnDetail): SalesReturnDetail {
  return {
    ...detail,
    serialNumbers: detail.serialNumbers || [],
    serialNosText:
      detail.serialNosText || formatSerialNumbersText(detail.serialNumbers)
  };
}

function prepareFormData(order: SalesReturnOrder): SalesReturnOrder {
  return {
    ...order,
    details: (order.details || []).map(prepareDetail)
  };
}

async function loadBaseData() {
  try {
    const [tireData, repoData, managerData] = await Promise.all([
      localForage().getItem(ALL_LIST.tire),
      localForage().getItem(ALL_LIST.repo),
      localForage().getItem(ALL_LIST.manager)
    ]);
    allTireList.value = (tireData as SelectItem[]) || [];
    allRepoList.value = (repoData as SelectItem[]) || [];
    managerList.value = (managerData as SelectItem[]) || [];
  } catch {
    message("加载基础数据失败", { type: "error" });
  }
}

function findReturnableSource(sourceUid?: string) {
  if (!sourceUid) return undefined;
  return returnableSourceList.value.find(
    item => item.deliveryNoteLineUid === sourceUid
  );
}

function formatReturnableSourceLabel(source: ReturnableSource) {
  return [
    source.deliveryNoteNo,
    source.tireName,
    `剩余${source.remainingQuantity}`,
    source.repoName
  ].join(" | ");
}

function getSourceOptions(row: SalesReturnDetail) {
  return returnableSourceList.value.filter(item => {
    if (item.deliveryNoteLineUid === row.sourceDeliveryNoteLineUid) {
      return true;
    }
    if (!row.tireId) {
      return true;
    }
    return item.tireId === row.tireId;
  });
}

function resolveSourceDisplay(row: SalesReturnDetail) {
  const source = findReturnableSource(row.sourceDeliveryNoteLineUid);
  return source
    ? formatReturnableSourceLabel(source)
    : row.sourceDeliveryNoteLineUid || "-";
}

function resolveDetailCountMax(row: SalesReturnDetail) {
  const source = findReturnableSource(row.sourceDeliveryNoteLineUid);
  return source?.remainingQuantity || 9999;
}

function applySourceToDetail(row: SalesReturnDetail) {
  const source = findReturnableSource(row.sourceDeliveryNoteLineUid);
  if (!source) {
    calcDetailTotal(row);
    return;
  }
  row.tireId = source.tireId;
  row.tireName = source.tireName;
  row.unitPrice = source.unitPrice;
  if (!row.repoId) {
    row.repoId = source.repoId;
    row.repoName = source.repoName;
  }
  const nextCount = Math.min(
    Math.max(row.count || 1, 1),
    source.remainingQuantity
  );
  row.count = nextCount;
  calcDetailTotal(row);
}

function syncSourceSelections() {
  const validSourceUids = new Set(
    returnableSourceList.value.map(item => item.deliveryNoteLineUid)
  );
  formData.value.details.forEach(detail => {
    if (!detail.sourceDeliveryNoteLineUid) return;
    if (!validSourceUids.has(detail.sourceDeliveryNoteLineUid)) {
      detail.sourceDeliveryNoteLineUid = undefined;
      return;
    }
    applySourceToDetail(detail);
  });
}

async function loadReturnableSources(customerId?: string) {
  if (!customerId) {
    returnableSourceList.value = [];
    syncSourceSelections();
    return;
  }
  returnableSourceLoading.value = true;
  try {
    const res = await getSalesReturnableSourcesApi(customerId);
    if (res.code !== 200) {
      returnableSourceList.value = [];
      message(res.msg || "加载可退货来源失败", { type: "error" });
      syncSourceSelections();
      return;
    }
    returnableSourceList.value = res.data || [];
    syncSourceSelections();
  } catch (error) {
    returnableSourceList.value = [];
    syncSourceSelections();
    handleApiError(error, "加载可退货来源失败");
  } finally {
    returnableSourceLoading.value = false;
  }
}

function onAddDetail() {
  formData.value.details.push({
    sourceDeliveryNoteLineUid: undefined,
    tireId: "",
    count: 1,
    unitPrice: 0,
    total: 0,
    repoId: "",
    returnReason: "",
    serialNumbers: [],
    serialNosText: "",
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

function calcDetailTotal(row: SalesReturnDetail) {
  row.total = (row.count || 0) * (row.unitPrice || 0);
  recalcOrderTotal();
}

function syncDetailSerialNumbers(row: SalesReturnDetail) {
  const serialNumbers = parseSerialNumbersText(row.serialNosText);
  row.serialNumbers = serialNumbers;
  if (serialNumbers.length > 0) {
    row.count = serialNumbers.length;
  }
  calcDetailTotal(row);
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

defineExpose({ formRef: ruleFormRef });

onMounted(() => {
  loadBaseData();
});

watch(
  () => props.formInline,
  val => {
    formData.value = prepareFormData(val);
    syncSourceSelections();
  },
  { immediate: true }
);

watch(
  () => formData.value.customerId,
  customerId => {
    loadReturnableSources(customerId || undefined);
  },
  { immediate: true }
);
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="formData"
    :rules="formRules"
    label-width="100px"
    class="sales-return-form"
  >
    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="客户" prop="customerId">
          <CustomerSelect
            v-model="formData.customerId"
            placeholder="请选择客户"
            :disabled="isReadOnly || !!formData.sourceOrderId"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="退货原因" prop="returnReason">
          <el-select
            v-model="formData.returnReason"
            placeholder="请选择退货原因"
            clearable
            :disabled="isReadOnly"
            class="w-full"
          >
            <el-option
              v-for="item in returnReasonOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
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
        <el-form-item label="退货单号">
          <el-input v-model="formData.number" disabled />
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

    <template v-if="['退款'].includes(formTitle)">
      <el-divider>退款信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="退款金额" prop="refundAmount">
            <el-input-number
              v-model="formData.refundAmount"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="退款账户" prop="paymentId">
            <PaymentSelect
              v-model="formData.paymentId"
              placeholder="请选择退款账户"
              class="w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <el-divider>退货明细</el-divider>

    <pure-table
      row-key="uid"
      :columns="salesReturnDetailColumns"
      :data="formData.details"
      border
      adaptive
      show-overflow-tooltip
    >
      <template #sourceDeliveryNoteLineSelect="{ row }">
        <span v-if="isReadOnly">{{ resolveSourceDisplay(row) }}</span>
        <el-select
          v-else
          v-model="row.sourceDeliveryNoteLineUid"
          placeholder="选择来源发货"
          clearable
          filterable
          :loading="returnableSourceLoading"
          :disabled="!formData.customerId"
          @change="applySourceToDetail(row)"
        >
          <el-option
            v-for="item in getSourceOptions(row)"
            :key="item.deliveryNoteLineUid"
            :label="formatReturnableSourceLabel(item)"
            :value="item.deliveryNoteLineUid"
          />
        </el-select>
      </template>

      <template #tireIdSelect="{ row }">
        <el-select
          v-model="row.tireId"
          placeholder="选择商品"
          clearable
          filterable
          :disabled="isReadOnly || !!row.sourceDeliveryNoteLineUid"
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
          :max="resolveDetailCountMax(row)"
          :disabled="isReadOnly || Boolean(row.serialNumbers?.length)"
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
          placeholder="退回仓库"
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

      <template #returnReasonSelect="{ row }">
        <el-select
          v-model="row.returnReason"
          placeholder="退货原因"
          clearable
          :disabled="isReadOnly"
        >
          <el-option
            v-for="item in returnReasonOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </template>

      <template #serialNosInput="{ row }">
        <el-input
          v-model="row.serialNosText"
          type="textarea"
          :rows="3"
          placeholder="每行一个胎号；也可按 serialNo,dotCode,dotYear,dotWeek,remark 录入"
          :disabled="isReadOnly"
          @change="syncDetailSerialNumbers(row)"
        />
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
          添加退货明细
        </el-button>
      </template>
    </pure-table>

    <el-divider>金额汇总</el-divider>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="退货数量">
          <el-input-number v-model="formData.count" disabled class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="应退金额">
          <el-input-number
            v-model="formData.showTotal"
            disabled
            :precision="2"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="实退金额">
          <el-input-number
            v-model="formData.total"
            :precision="2"
            :disabled="isReadOnly"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="已退款">
          <el-input-number
            v-model="formData.refundAmount"
            disabled
            :precision="2"
            class="w-full"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

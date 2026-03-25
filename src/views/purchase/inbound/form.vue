<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  INBOUND_SOURCE_MODE_LABELS,
  type InboundOrder,
  type InboundOrderDetail
} from "./types";
import { inboundOrderDetailColumns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import { ALL_LIST, localForage, message } from "@/utils";
import {
  formatSerialNumbersText,
  parseSerialNumbersText
} from "@/utils/serialNumber";
import ProviderSelect from "@/components/EntitySelect/ProviderSelect.vue";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";
import { loadInventoryDefaults } from "@/composables";
import { logger } from "@/utils/logger";

const props = withDefaults(
  defineProps<{
    formInline: InboundOrder;
    formTitle?: string;
  }>(),
  {
    formTitle: "新增"
  }
);

const ruleFormRef = ref<FormInstance>();
const formData = ref<InboundOrder>(props.formInline);

const formRules: FormRules = {
  providerId: [{ required: true, message: "请选择供应商", trigger: "change" }]
};

interface SelectItem {
  uid: string;
  name: string;
  balance?: number;
}

const allTireList = ref<SelectItem[]>([]);
const allRepoList = ref<SelectItem[]>([]);
const managerList = ref<SelectItem[]>([]);

const isReadOnly = computed(() => ["查看", "审核"].includes(props.formTitle));

const canEditHeader = computed(() =>
  ["新增", "修改"].includes(props.formTitle)
);

const canEditDetails = computed(() => props.formTitle === "新增");

const sourceModeLabel = computed(
  () =>
    INBOUND_SOURCE_MODE_LABELS[formData.value.sourceMode || "MANUAL"] ||
    INBOUND_SOURCE_MODE_LABELS.MANUAL
);

const orderNumberText = computed(() =>
  String(formData.value.docNo || formData.value.number || "")
);

const sourcePurchaseOrderText = computed(() =>
  String(
    formData.value.sourcePurchaseOrder?.docNo ||
      formData.value.sourcePurchaseOrder?.number ||
      "-"
  )
);

function prepareDetail(detail: InboundOrderDetail): InboundOrderDetail {
  return {
    ...detail,
    serialNumbers: detail.serialNumbers || [],
    serialNosText:
      detail.serialNosText || formatSerialNumbersText(detail.serialNumbers)
  };
}

function prepareFormData(order: InboundOrder): InboundOrder {
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

const defaultWarehouseId = ref<string | undefined>(undefined);

async function loadDefaultWarehouseId() {
  try {
    const defaults = await loadInventoryDefaults();
    defaultWarehouseId.value = defaults.defaultWarehouseId;
  } catch (error) {
    logger.error("[InventoryDefaults] load failed", error);
  }
}

function onAddDetail() {
  formData.value.details.push({
    tireId: "",
    count: 1,
    unitPrice: 0,
    total: 0,
    repoId: defaultWarehouseId.value || "",
    batchNo: "",
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

function calcDetailTotal(row: InboundOrderDetail) {
  row.total = (row.count || 0) * (row.unitPrice || 0);
  recalcOrderTotal();
}

function syncDetailSerialNumbers(row: InboundOrderDetail) {
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
  void loadDefaultWarehouseId();
});

watch(
  () => props.formInline,
  val => {
    formData.value = prepareFormData(val);
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
    class="inbound-order-form"
  >
    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="供应商" prop="providerId">
          <ProviderSelect
            v-model="formData.providerId"
            placeholder="请选择供应商"
            :disabled="isReadOnly || formData.sourceMode === 'PO_LINKED'"
            class="w-full"
          />
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
        <el-form-item label="单据编号">
          <el-input :model-value="orderNumberText" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="来源方式">
          <el-input :model-value="sourceModeLabel" disabled />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="来源采购单">
          <el-input :model-value="sourcePurchaseOrderText" disabled />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="备注">
      <el-input
        v-model="formData.desc"
        type="textarea"
        :rows="2"
        placeholder="请输入备注信息"
        :disabled="!canEditHeader"
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

    <template v-if="['付款'].includes(formTitle)">
      <el-divider>付款信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="本次付款" prop="paidAmount">
            <el-input-number
              v-model="formData.paidAmount"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="付款账户" prop="paymentId">
            <PaymentSelect
              v-model="formData.paymentId"
              placeholder="请选择付款账户"
              class="w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <el-divider>入库明细</el-divider>

    <pure-table
      row-key="uid"
      :columns="inboundOrderDetailColumns"
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
          :disabled="!canEditDetails"
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
          :disabled="!canEditDetails || Boolean(row.serialNumbers?.length)"
          controls-position="right"
          @change="calcDetailTotal(row)"
        />
      </template>

      <template #unitPriceInput="{ row }">
        <el-input-number
          v-model="row.unitPrice"
          :min="0"
          :precision="2"
          :disabled="!canEditDetails"
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
          :disabled="!canEditDetails"
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
          :disabled="!canEditDetails"
        />
      </template>

      <template #productionDateInput="{ row }">
        <el-date-picker
          v-model="row.productionDate"
          type="date"
          placeholder="生产日期"
          value-format="YYYY-MM-DD"
          :disabled="!canEditDetails"
          class="w-full"
        />
      </template>

      <template #expiryDateInput="{ row }">
        <el-date-picker
          v-model="row.expiryDate"
          type="date"
          placeholder="过期日期"
          value-format="YYYY-MM-DD"
          :disabled="!canEditDetails"
          class="w-full"
        />
      </template>

      <template #serialNosInput="{ row }">
        <el-input
          v-model="row.serialNosText"
          type="textarea"
          :rows="3"
          placeholder="每行一个胎号；也可按 serialNo,dotCode,dotYear,dotWeek,remark 录入"
          :disabled="!canEditDetails"
          @change="syncDetailSerialNumbers(row)"
        />
      </template>

      <template #descInput="{ row }">
        <el-input
          v-model="row.desc"
          placeholder="备注"
          :disabled="!canEditDetails"
        />
      </template>

      <template #operation="{ $index }">
        <el-popconfirm title="确认删除此行?" @confirm="onDeleteDetail($index)">
          <template #reference>
            <el-button
              v-if="canEditDetails"
              link
              type="danger"
              :icon="useRenderIcon(Delete)"
            >
              删除
            </el-button>
          </template>
        </el-popconfirm>
      </template>

      <template v-if="canEditDetails" #append>
        <el-button
          plain
          class="w-full my-2"
          :icon="useRenderIcon(AddFill)"
          @click="onAddDetail"
        >
          添加入库明细
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
        <el-form-item label="入库金额">
          <el-input-number
            v-model="formData.showTotal"
            disabled
            :precision="2"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="单据金额">
          <el-input-number
            v-model="formData.total"
            :precision="2"
            :disabled="!canEditHeader"
            class="w-full"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="已付金额">
          <el-input-number
            v-model="formData.paidAmount"
            :precision="2"
            :disabled="!canEditHeader"
            class="w-full"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

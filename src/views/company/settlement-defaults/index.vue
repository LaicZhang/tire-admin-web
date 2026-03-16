<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { handleApiError, message } from "@/utils";
import {
  getCompanySettingGroupApi,
  patchCompanySettingGroupApi,
  type CompanySettingItem
} from "@/api/setting/company-setting";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod
} from "@/views/fund/payment/types";
import { invalidateSettlementDefaultsCache } from "@/composables";

defineOptions({
  name: "CompanySettlementDefaults"
});

const loading = ref(false);

type FormModel = {
  defaultPaymentMethod: PaymentMethod | "";
  defaultReceivableAccount?: string;
  defaultPayableAccount?: string;
  allowBackdateDays: number;
};

const form = reactive<FormModel>({
  defaultPaymentMethod: "",
  defaultReceivableAccount: undefined,
  defaultPayableAccount: undefined,
  allowBackdateDays: 0
});

function pickValue(
  list: CompanySettingItem[] | undefined,
  key: string
): string {
  const found = Array.isArray(list) ? list.find(i => i.key === key) : undefined;
  return String(found?.value ?? "").trim();
}

function pickNumber(
  list: CompanySettingItem[] | undefined,
  key: string
): number {
  const raw = pickValue(list, key);
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

async function load() {
  loading.value = true;
  try {
    const [settlement, document] = await Promise.all([
      getCompanySettingGroupApi("settlement"),
      getCompanySettingGroupApi("document")
    ]);
    const settlementList = settlement.code === 200 ? settlement.data : [];
    const documentList = document.code === 200 ? document.data : [];

    form.defaultPaymentMethod =
      (pickValue(settlementList, "defaultPaymentMethod") as PaymentMethod) ||
      "";
    form.defaultReceivableAccount =
      pickValue(settlementList, "defaultReceivableAccount") || undefined;
    form.defaultPayableAccount =
      pickValue(settlementList, "defaultPayableAccount") || undefined;
    form.allowBackdateDays = Math.max(
      0,
      Math.floor(pickNumber(documentList, "allowBackdateDays"))
    );
  } catch (error) {
    handleApiError(error, "加载默认值设置失败");
  } finally {
    loading.value = false;
  }
}

async function save() {
  loading.value = true;
  try {
    const settlementSettings: Record<string, unknown> = {
      defaultPaymentMethod: form.defaultPaymentMethod || "",
      defaultReceivableAccount: form.defaultReceivableAccount || "",
      defaultPayableAccount: form.defaultPayableAccount || ""
    };
    const documentSettings: Record<string, unknown> = {
      allowBackdateDays: form.allowBackdateDays
    };

    const [settlementRes, documentRes] = await Promise.all([
      patchCompanySettingGroupApi("settlement", settlementSettings),
      patchCompanySettingGroupApi("document", documentSettings)
    ]);

    if (settlementRes.code !== 200 || documentRes.code !== 200) {
      message(settlementRes.msg || documentRes.msg || "保存失败", {
        type: "error"
      });
      return;
    }
    invalidateSettlementDefaultsCache();
    message("保存成功", { type: "success" });
  } catch (error) {
    handleApiError(error, "保存失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="main p-4">
    <div class="bg-white p-6 rounded-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium">结算默认值</h3>
        <el-button type="primary" :loading="loading" @click="save">
          保存设置
        </el-button>
      </div>

      <el-form :model="form" label-width="180px" label-position="left">
        <el-divider content-position="left">结算默认值</el-divider>

        <el-form-item label="默认结算方式">
          <el-select
            v-model="form.defaultPaymentMethod"
            placeholder="不设置则不默认带出"
            clearable
            class="w-full"
          >
            <el-option
              v-for="item in PAYMENT_METHOD_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="默认收款账户">
          <PaymentSelect
            v-model="form.defaultReceivableAccount"
            placeholder="不设置则创建收款单时必须手动选择"
          />
        </el-form-item>

        <el-form-item label="默认付款账户">
          <PaymentSelect
            v-model="form.defaultPayableAccount"
            placeholder="不设置则创建付款单时必须手动选择"
          />
        </el-form-item>

        <el-divider content-position="left">单据日期</el-divider>

        <el-form-item label="允许回填天数">
          <el-input-number
            v-model="form.allowBackdateDays"
            :min="0"
            :precision="0"
            class="w-full"
          />
          <span class="ml-3 text-gray-500 text-sm">
            0 表示不允许回填（只能填今天及之后）
          </span>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

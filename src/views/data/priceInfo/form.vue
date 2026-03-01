<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormRules } from "element-plus";
import type { PriceInfoForm } from "./types";
import { fieldRules } from "@/utils/validation/fieldRules";

interface FormProps {
  formInline?: PriceInfoForm;
  tireName?: string;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    tireId: "",
    retailPrice: undefined,
    wholesalePrice: undefined,
    vipPrice: undefined,
    memberPrice: undefined,
    minSalePrice: undefined,
    maxPurchasePrice: undefined
  }),
  tireName: ""
});

const formRules = reactive<FormRules>({
  tireId: fieldRules.uidSelect({ label: "商品" }),
  retailPrice: fieldRules.moneyYuan({
    required: false,
    label: "零售价",
    min: 0
  }),
  wholesalePrice: fieldRules.moneyYuan({
    required: false,
    label: "批发价",
    min: 0
  }),
  vipPrice: fieldRules.moneyYuan({ required: false, label: "VIP价", min: 0 }),
  memberPrice: fieldRules.moneyYuan({
    required: false,
    label: "会员价",
    min: 0
  }),
  minSalePrice: fieldRules.moneyYuan({
    required: false,
    label: "最低销售价",
    min: 0
  }),
  maxPurchasePrice: fieldRules.moneyYuan({
    required: false,
    label: "最高采购价",
    min: 0
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

// 自动换算价格
const autoCalculate = ref(false);
const basePrice = ref<number>();

const handleAutoCalculate = () => {
  if (!autoCalculate.value || !basePrice.value) return;

  // 按比例自动计算其他价格
  newFormInline.value.retailPrice = basePrice.value;
  newFormInline.value.wholesalePrice =
    Math.round(basePrice.value * 0.9 * 100) / 100;
  newFormInline.value.vipPrice = Math.round(basePrice.value * 0.85 * 100) / 100;
  newFormInline.value.memberPrice =
    Math.round(basePrice.value * 0.8 * 100) / 100;
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="120px"
  >
    <el-form-item label="商品">
      <span class="font-bold">{{ tireName || "-" }}</span>
    </el-form-item>

    <el-divider content-position="left">价格设置</el-divider>

    <el-form-item label="自动换算">
      <el-switch v-model="autoCalculate" />
      <span class="ml-2 text-gray-400 text-sm"
        >启用后可根据基础价格自动计算其他价格</span
      >
    </el-form-item>

    <el-form-item v-if="autoCalculate" label="基础价格">
      <el-input-number
        v-model="basePrice"
        :min="0"
        :precision="2"
        placeholder="输入基础价格"
        @change="handleAutoCalculate"
      />
      <el-button
        class="ml-2"
        type="primary"
        size="small"
        @click="handleAutoCalculate"
      >
        计算
      </el-button>
    </el-form-item>

    <div class="grid grid-cols-2 gap-4">
      <el-form-item label="零售价" prop="retailPrice">
        <el-input-number
          v-model="newFormInline.retailPrice"
          :min="0"
          :precision="2"
          placeholder="请输入零售价"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="批发价" prop="wholesalePrice">
        <el-input-number
          v-model="newFormInline.wholesalePrice"
          :min="0"
          :precision="2"
          placeholder="请输入批发价"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="VIP价" prop="vipPrice">
        <el-input-number
          v-model="newFormInline.vipPrice"
          :min="0"
          :precision="2"
          placeholder="请输入VIP价"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="会员价" prop="memberPrice">
        <el-input-number
          v-model="newFormInline.memberPrice"
          :min="0"
          :precision="2"
          placeholder="请输入会员价"
          class="w-full"
        />
      </el-form-item>
    </div>

    <el-divider content-position="left">限价设置</el-divider>

    <div class="grid grid-cols-2 gap-4">
      <el-form-item label="最低销售价" prop="minSalePrice">
        <el-input-number
          v-model="newFormInline.minSalePrice"
          :min="0"
          :precision="2"
          placeholder="请输入最低销售价"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="最高采购价" prop="maxPurchasePrice">
        <el-input-number
          v-model="newFormInline.maxPurchasePrice"
          :min="0"
          :precision="2"
          placeholder="请输入最高采购价"
          class="w-full"
        />
      </el-form-item>
    </div>
  </el-form>
</template>

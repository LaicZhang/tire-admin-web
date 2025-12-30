<script setup lang="ts">
import { ref } from "vue";
import type { CodeRuleFormProps } from "./types";

const props = withDefaults(defineProps<CodeRuleFormProps>(), {
  formInline: () => ({
    name: "",
    targetType: "document",
    targetCode: "",
    prefix: "",
    dateFormat: "YYYYMMDD",
    serialDigits: 4,
    serialStart: 1,
    resetType: "daily",
    autoFillGap: false,
    allowManualEdit: false,
    resetOnDateChange: false
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const targetOptions = {
  document: [
    { value: "purchase_order", label: "采购订单" },
    { value: "purchase_in", label: "采购入库单" },
    { value: "purchase_return", label: "采购退货单" },
    { value: "sales_order", label: "销售订单" },
    { value: "sales_out", label: "销售出库单" },
    { value: "sales_return", label: "销售退货单" },
    { value: "transfer", label: "调拨单" },
    { value: "inventory_check", label: "盘点单" }
  ],
  basic: [
    { value: "product", label: "商品" },
    { value: "customer", label: "客户" },
    { value: "supplier", label: "供应商" },
    { value: "warehouse", label: "仓库" }
  ]
};

const dateFormatOptions = [
  { value: "YYYYMMDD", label: "YYYYMMDD (如: 20240101)" },
  { value: "YYMMDD", label: "YYMMDD (如: 240101)" },
  { value: "YYYYMM", label: "YYYYMM (如: 202401)" },
  { value: "YYMM", label: "YYMM (如: 2401)" },
  { value: "", label: "不使用日期" }
];

const resetTypeOptions = [
  { value: "daily", label: "当日从起始值开始" },
  { value: "monthly", label: "当月从起始值开始" },
  { value: "quarterly", label: "当季从起始值开始" },
  { value: "yearly", label: "当年从起始值开始" }
];

const rules = {
  name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  targetCode: [
    { required: true, message: "请选择适用对象", trigger: "change" }
  ],
  serialDigits: [
    { required: true, message: "请选择流水号位数", trigger: "change" }
  ]
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
    :rules="rules"
    label-width="140px"
  >
    <el-form-item label="规则名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入规则名称"
      />
    </el-form-item>

    <el-form-item label="规则类型" prop="targetType">
      <el-radio-group v-model="newFormInline.targetType">
        <el-radio value="document">单据编码</el-radio>
        <el-radio value="basic">基础资料编码</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="适用对象" prop="targetCode">
      <el-select
        v-model="newFormInline.targetCode"
        placeholder="请选择适用对象"
        class="w-full"
      >
        <el-option
          v-for="item in targetOptions[newFormInline.targetType || 'document']"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="编码前缀" prop="prefix">
      <el-input
        v-model="newFormInline.prefix"
        clearable
        placeholder="如: PO、SO"
      />
    </el-form-item>

    <el-form-item label="日期格式" prop="dateFormat">
      <el-select
        v-model="newFormInline.dateFormat"
        placeholder="请选择日期格式"
        class="w-full"
      >
        <el-option
          v-for="item in dateFormatOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="流水号位数" prop="serialDigits">
      <el-select
        v-model="newFormInline.serialDigits"
        placeholder="请选择流水号位数"
        class="w-full"
      >
        <el-option
          v-for="i in [3, 4, 5, 6, 7, 8, 9, 10]"
          :key="i"
          :label="`${i}位`"
          :value="i"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="流水号起始值" prop="serialStart">
      <el-input-number
        v-model="newFormInline.serialStart"
        :min="0"
        :max="999999"
      />
    </el-form-item>

    <el-form-item label="流水号清零" prop="resetType">
      <el-select
        v-model="newFormInline.resetType"
        placeholder="请选择清零规则"
        class="w-full"
      >
        <el-option
          v-for="item in resetTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-divider />

    <el-form-item label="日期变化时重新编码">
      <el-switch v-model="newFormInline.resetOnDateChange" />
      <span class="ml-4 text-gray-500 text-sm">
        修改单据日期时，将重新编码
      </span>
    </el-form-item>

    <el-form-item label="自动填补断号">
      <el-switch v-model="newFormInline.autoFillGap" />
      <span class="ml-4 text-gray-500 text-sm">
        编号连接不上时，自动填充空缺的编码
      </span>
    </el-form-item>

    <el-form-item label="允许手动修改编码">
      <el-switch v-model="newFormInline.allowManualEdit" />
      <span class="ml-4 text-gray-500 text-sm">
        编码生效后允许手动输入编码
      </span>
    </el-form-item>
  </el-form>
</template>

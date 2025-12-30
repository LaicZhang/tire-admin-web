<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormRules } from "element-plus";
import type { SupplierBalanceForm } from "./types";

interface FormProps {
  formInline?: SupplierBalanceForm;
  isEdit?: boolean;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    supplierId: "",
    payableBalance: 0,
    prepaidBalance: 0,
    balanceDate: undefined,
    remark: ""
  }),
  isEdit: false
});

const formRules = reactive<FormRules>({
  supplierId: [{ required: true, message: "请选择供应商", trigger: "change" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

// 模拟供应商列表
const supplierList = ref([
  { uid: "s1", name: "供应商A", code: "SUP-001", phone: "13900139001" },
  { uid: "s2", name: "供应商B", code: "SUP-002", phone: "13900139002" },
  { uid: "s3", name: "供应商C", code: "SUP-003", phone: "13900139003" }
]);

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
    <el-form-item label="供应商" prop="supplierId">
      <el-select
        v-model="newFormInline.supplierId"
        placeholder="请选择供应商"
        filterable
        class="w-full"
        :disabled="isEdit"
      >
        <el-option
          v-for="item in supplierList"
          :key="item.uid"
          :label="`${item.name} (${item.code})`"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="余额日期" prop="balanceDate">
      <el-date-picker
        v-model="newFormInline.balanceDate"
        type="date"
        placeholder="请选择余额日期"
        value-format="YYYY-MM-DD"
        class="w-full"
      />
    </el-form-item>

    <el-divider content-position="left">余额设置</el-divider>

    <el-form-item label="期初应付余额" prop="payableBalance">
      <el-input-number
        v-model="newFormInline.payableBalance"
        :precision="2"
        placeholder="请输入期初应付余额"
        class="w-full"
      />
      <div class="text-gray-400 text-sm mt-1">
        正数表示欠供应商款项，负数表示多付款项
      </div>
    </el-form-item>

    <el-form-item label="期初预付余额" prop="prepaidBalance">
      <el-input-number
        v-model="newFormInline.prepaidBalance"
        :min="0"
        :precision="2"
        placeholder="请输入期初预付余额"
        class="w-full"
      />
      <div class="text-gray-400 text-sm mt-1">预付给供应商的款项余额</div>
    </el-form-item>

    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="newFormInline.remark"
        type="textarea"
        placeholder="请输入备注"
        :rows="3"
      />
    </el-form-item>
  </el-form>
</template>

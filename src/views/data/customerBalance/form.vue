<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormRules } from "element-plus";
import type { CustomerBalanceForm } from "./types";

interface FormProps {
  formInline?: CustomerBalanceForm;
  isEdit?: boolean;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    customerId: "",
    receivableBalance: 0,
    advanceBalance: 0,
    balanceDate: undefined,
    remark: ""
  }),
  isEdit: false
});

const formRules = reactive<FormRules>({
  customerId: [{ required: true, message: "请选择客户", trigger: "change" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

// 模拟客户列表
const customerList = ref([
  { uid: "c1", name: "客户A", code: "CUS-001", phone: "13800138001" },
  { uid: "c2", name: "客户B", code: "CUS-002", phone: "13800138002" },
  { uid: "c3", name: "客户C", code: "CUS-003", phone: "13800138003" }
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
    <el-form-item label="客户" prop="customerId">
      <el-select
        v-model="newFormInline.customerId"
        placeholder="请选择客户"
        filterable
        class="w-full"
        :disabled="isEdit"
      >
        <el-option
          v-for="item in customerList"
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

    <el-form-item label="期初应收余额" prop="receivableBalance">
      <el-input-number
        v-model="newFormInline.receivableBalance"
        :precision="2"
        placeholder="请输入期初应收余额"
        class="w-full"
      />
      <div class="text-gray-400 text-sm mt-1">
        正数表示客户欠款，负数表示多收款项
      </div>
    </el-form-item>

    <el-form-item label="期初预收余额" prop="advanceBalance">
      <el-input-number
        v-model="newFormInline.advanceBalance"
        :min="0"
        :precision="2"
        placeholder="请输入期初预收余额"
        class="w-full"
      />
      <div class="text-gray-400 text-sm mt-1">客户预付的款项余额</div>
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

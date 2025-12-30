<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormRules } from "element-plus";
import type { CustomerProductCodeForm } from "./types";

interface FormProps {
  formInline?: CustomerProductCodeForm;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    customerId: "",
    tireId: "",
    customerCode: "",
    customerProductName: "",
    remark: ""
  })
});

const formRules = reactive<FormRules>({
  customerId: [{ required: true, message: "请选择客户", trigger: "change" }],
  tireId: [{ required: true, message: "请选择商品", trigger: "change" }],
  customerCode: [
    { required: true, message: "请输入客户商品编码", trigger: "blur" }
  ]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

// 模拟客户列表
const customerList = ref([
  { uid: "c1", name: "客户A" },
  { uid: "c2", name: "客户B" },
  { uid: "c3", name: "客户C" }
]);

// 模拟商品列表
const tireList = ref([
  { uid: "t1", name: "轮胎A" },
  { uid: "t2", name: "轮胎B" },
  { uid: "t3", name: "轮胎C" }
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
      >
        <el-option
          v-for="item in customerList"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="商品" prop="tireId">
      <el-select
        v-model="newFormInline.tireId"
        placeholder="请选择商品"
        filterable
        class="w-full"
      >
        <el-option
          v-for="item in tireList"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="客户商品编码" prop="customerCode">
      <el-input
        v-model="newFormInline.customerCode"
        placeholder="请输入客户商品编码"
        clearable
      />
    </el-form-item>

    <el-form-item label="客户商品名称" prop="customerProductName">
      <el-input
        v-model="newFormInline.customerProductName"
        placeholder="请输入客户商品名称"
        clearable
      />
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

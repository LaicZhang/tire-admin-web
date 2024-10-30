<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormRules } from "element-plus";

interface FormItemProps {
  id?: number;
  uid?: string;
  group: string;
  name: string;
  desc?: string;
  unit: string;
  pattern: string;
  brand: string;
  loadIndex: string;
  speedLevel: string;
  format: string;
  weight: string;
  purchasePriceWithTax: string;
  purchasePrice: string;
  salePriceWithTax: string;
  salePrice: string;
  commissionType: number;
  commission: string;
}

interface FormProps {
  formInline: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    id: 0,
    uid: "",
    group: "",
    name: "",
    desc: undefined,
    unit: "条",
    pattern: "",
    brand: "",
    loadIndex: "",
    speedLevel: "",
    format: "",
    weight: "",
    purchasePriceWithTax: "",
    purchasePrice: "",
    salePriceWithTax: "",
    salePrice: "",
    commissionType: 0,
    commission: ""
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "名称为必填项", trigger: "blur" }],
  salePrice: [{ required: true, message: "售价为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

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
    label-width="82px"
  >
    <el-form-item label="名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入名称"
      />
    </el-form-item>

    <el-form-item label="分组" prop="group">
      <el-input
        v-model="newFormInline.group"
        clearable
        placeholder="请输入分组"
      />
    </el-form-item>

    <el-form-item label="单位" prop="unit">
      <el-input v-model="newFormInline.unit" clearable placeholder="默认为条" />
    </el-form-item>

    <el-form-item label="品牌" prop="brand">
      <el-input
        v-model="newFormInline.brand"
        clearable
        placeholder="请输入品牌"
      />
    </el-form-item>

    <el-form-item label="花纹" prop="pattern">
      <el-input
        v-model="newFormInline.pattern"
        clearable
        placeholder="请输入花纹"
      />
    </el-form-item>

    <el-form-item label="载重指数" prop="loadIndex">
      <el-input
        v-model="newFormInline.loadIndex"
        clearable
        placeholder="请输入载重指数"
      />
    </el-form-item>

    <el-form-item label="速度级别" prop="speedLevel">
      <el-input
        v-model="newFormInline.speedLevel"
        clearable
        placeholder="请输入速度级别"
      />
    </el-form-item>

    <el-form-item label="规格" prop="format">
      <el-input
        v-model="newFormInline.format"
        clearable
        placeholder="请输入规格"
      />
    </el-form-item>

    <el-form-item label="重量" prop="weight">
      <el-input
        v-model="newFormInline.weight"
        clearable
        placeholder="请输入重量"
      />
    </el-form-item>

    <el-form-item label="含税进价" prop="purchasePriceWithTax">
      <el-input
        v-model="newFormInline.purchasePriceWithTax"
        clearable
        placeholder="请输入含税进价"
      />
    </el-form-item>

    <el-form-item label="进价" prop="purchasePrice">
      <el-input
        v-model="newFormInline.purchasePrice"
        clearable
        placeholder="请输入进价"
      />
    </el-form-item>

    <el-form-item label="含税售价" prop="salePriceWithTax">
      <el-input
        v-model="newFormInline.salePriceWithTax"
        clearable
        placeholder="请输入含税售价"
      />
    </el-form-item>

    <el-form-item label="售价" prop="salePrice">
      <el-input
        v-model="newFormInline.salePrice"
        clearable
        placeholder="请输入售价"
      />
    </el-form-item>

    <el-form-item label="备注" prop="desc">
      <el-input
        v-model="newFormInline.desc"
        placeholder="请输入备注信息"
        type="textarea"
      />
    </el-form-item>
  </el-form>
</template>

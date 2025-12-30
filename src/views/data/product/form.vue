<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormProps } from "./types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    group: "默认",
    brand: "",
    pattern: "",
    format: "",
    unit: "个",
    purchasePrice: undefined,
    salePrice: undefined,
    minStock: undefined,
    maxStock: undefined,
    enableSerialNumber: false,
    enableBatch: false,
    desc: ""
  }),
  disabled: false
});

const formRules = reactive({
  name: [{ required: true, message: "商品名称为必填项", trigger: "blur" }],
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
    :disabled="disabled"
    label-width="100px"
  >
    <el-form-item label="商品名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入商品名称"
      />
    </el-form-item>

    <el-form-item label="分组" prop="group">
      <el-input
        v-model="newFormInline.group"
        clearable
        placeholder="请输入分组"
      />
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

    <el-form-item label="规格" prop="format">
      <el-input
        v-model="newFormInline.format"
        clearable
        placeholder="请输入规格"
      />
    </el-form-item>

    <el-form-item label="单位" prop="unit">
      <el-input
        v-model="newFormInline.unit"
        clearable
        placeholder="请输入单位"
        class="w-32"
      />
    </el-form-item>

    <el-divider content-position="left">价格信息</el-divider>

    <div class="flex gap-4">
      <el-form-item label="进价" prop="purchasePrice">
        <el-input-number
          v-model="newFormInline.purchasePrice"
          :precision="2"
          :min="0"
          placeholder="进价"
        />
      </el-form-item>

      <el-form-item label="售价" prop="salePrice">
        <el-input-number
          v-model="newFormInline.salePrice"
          :precision="2"
          :min="0"
          placeholder="售价"
        />
      </el-form-item>
    </div>

    <el-divider content-position="left">库存预警</el-divider>

    <div class="flex gap-4">
      <el-form-item label="最低库存" prop="minStock">
        <el-input-number
          v-model="newFormInline.minStock"
          :min="0"
          placeholder="最低库存"
        />
      </el-form-item>

      <el-form-item label="最高库存" prop="maxStock">
        <el-input-number
          v-model="newFormInline.maxStock"
          :min="0"
          placeholder="最高库存"
        />
      </el-form-item>
    </div>

    <el-divider content-position="left">管理设置</el-divider>

    <el-form-item label="序列号管理">
      <el-switch v-model="newFormInline.enableSerialNumber" />
      <span class="ml-2 text-gray-400 text-sm"> 启用后可录入商品序列号 </span>
    </el-form-item>

    <el-form-item label="批次管理">
      <el-switch v-model="newFormInline.enableBatch" />
      <span class="ml-2 text-gray-400 text-sm"> 启用后可录入商品批次 </span>
    </el-form-item>

    <el-form-item label="备注" prop="desc">
      <el-input
        v-model="newFormInline.desc"
        type="textarea"
        placeholder="请输入备注信息"
        :rows="3"
      />
    </el-form-item>
  </el-form>
</template>

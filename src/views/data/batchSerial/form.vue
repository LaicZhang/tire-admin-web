<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormRules } from "element-plus";
import type { BatchForm } from "./types";

interface FormProps {
  formInline?: BatchForm;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    batchNo: "",
    tireId: "",
    repoId: "",
    quantity: 0,
    productionDate: undefined,
    expiryDate: undefined
  })
});

const formRules = reactive<FormRules>({
  batchNo: [{ required: true, message: "请输入批次号", trigger: "blur" }],
  tireId: [{ required: true, message: "请选择商品", trigger: "change" }],
  repoId: [{ required: true, message: "请选择仓库", trigger: "change" }],
  quantity: [{ required: true, message: "请输入数量", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

// 模拟数据
const tireList = ref([
  { uid: "t1", name: "轮胎A" },
  { uid: "t2", name: "轮胎B" }
]);

const repoList = ref([
  { uid: "r1", name: "主仓库" },
  { uid: "r2", name: "分仓库" }
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
    label-width="100px"
  >
    <el-form-item label="批次号" prop="batchNo">
      <el-input
        v-model="newFormInline.batchNo"
        placeholder="请输入批次号"
        clearable
      />
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

    <el-form-item label="仓库" prop="repoId">
      <el-select
        v-model="newFormInline.repoId"
        placeholder="请选择仓库"
        filterable
        class="w-full"
      >
        <el-option
          v-for="item in repoList"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="数量" prop="quantity">
      <el-input-number
        v-model="newFormInline.quantity"
        :min="0"
        :precision="0"
        class="w-full"
      />
    </el-form-item>

    <el-form-item label="生产日期" prop="productionDate">
      <el-date-picker
        v-model="newFormInline.productionDate"
        type="date"
        placeholder="请选择生产日期"
        value-format="YYYY-MM-DD"
        class="w-full"
      />
    </el-form-item>

    <el-form-item label="到期日期" prop="expiryDate">
      <el-date-picker
        v-model="newFormInline.expiryDate"
        type="date"
        placeholder="请选择到期日期"
        value-format="YYYY-MM-DD"
        class="w-full"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";

type Direction = "increase" | "decrease";

const ruleFormRef = ref<FormInstance>();

const form = reactive({
  direction: "increase" as Direction,
  amountYuan: 0,
  remark: ""
});

const rules: FormRules = {
  direction: [{ required: true, message: "请选择调整方向", trigger: "change" }],
  amountYuan: [
    { required: true, message: "请输入金额", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
          callback(new Error("金额必须大于 0"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ],
  remark: [
    {
      validator: (_rule, value, callback) => {
        if (typeof value === "string" && value.length > 200) {
          callback(new Error("备注不能超过 200 字"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ]
};

function getRef() {
  return ruleFormRef.value;
}

function getForm() {
  return { ...form };
}

defineExpose({ getRef, getForm });
</script>

<template>
  <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="100px">
    <el-form-item label="调整方向" prop="direction">
      <el-radio-group v-model="form.direction">
        <el-radio value="increase">增加</el-radio>
        <el-radio value="decrease">减少</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="金额（元）" prop="amountYuan">
      <el-input-number
        v-model="form.amountYuan"
        :min="0"
        :precision="2"
        class="w-full!"
      />
    </el-form-item>

    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="form.remark"
        type="textarea"
        :rows="2"
        maxlength="200"
        show-word-limit
        placeholder="可选，最多 200 字"
      />
    </el-form-item>
  </el-form>
</template>

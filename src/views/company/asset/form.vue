<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import { elementRules } from "@/utils/validation/elementRules";

const props = defineProps({
  formInline: {
    type: Object,
    default: () => ({
      title: "新增",
      name: "",
      type: 0,
      count: 1,
      unit: "个",
      initValue: 0,
      currentValue: 0,
      monthlyDepreciation: 0,
      status: true,
      isAuto: false,
      desc: ""
    })
  }
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  name: [
    elementRules.requiredStringTrim("请输入资产名称"),
    elementRules.maxLen(50, "资产名称最多 50 个字符")
  ],
  type: [
    {
      trigger: "change",
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === "")
          return callback(new Error("请选择资产类型"));
        if (![0, 1, 2].includes(Number(value)))
          return callback(new Error("资产类型不合法"));
        callback();
      }
    }
  ],
  count: [elementRules.positiveInt("数量需为正整数")],
  unit: [
    elementRules.requiredStringTrim("请输入单位"),
    elementRules.maxLen(10, "单位最多 10 个字符")
  ],
  initValue: [elementRules.nonNegativeNumber("原值不合法")],
  currentValue: [elementRules.nonNegativeNumber("当前价值不合法")],
  monthlyDepreciation: [elementRules.nonNegativeNumber("月折旧不合法")],
  desc: [elementRules.maxLen(200, "备注最多 200 个字符")]
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
    label-width="82px"
  >
    <el-form-item
      label="资产名称"
      prop="name"
      :rules="[{ required: true, message: '请输入资产名称', trigger: 'blur' }]"
    >
      <el-input
        v-model="newFormInline.name"
        placeholder="请输入资产名称"
        clearable
        maxlength="50"
        show-word-limit
      />
    </el-form-item>

    <el-form-item label="资产类型" prop="type" required>
      <el-select
        v-model="newFormInline.type"
        placeholder="请选择资产类型"
        class="w-full"
      >
        <el-option label="固定资产" :value="0" />
        <el-option label="无形资产" :value="1" />
        <el-option label="其他资产" :value="2" />
      </el-select>
    </el-form-item>

    <div class="flex">
      <el-form-item label="数量" prop="count">
        <el-input-number v-model="newFormInline.count" :min="1" />
      </el-form-item>
      <el-form-item label="单位" prop="unit">
        <el-input
          v-model="newFormInline.unit"
          placeholder="单位"
          class="!w-[100px]"
          maxlength="10"
        />
      </el-form-item>
    </div>

    <div class="flex">
      <el-form-item label="原值" prop="initValue">
        <el-input-number
          v-model="newFormInline.initValue"
          :min="0"
          :precision="2"
        />
      </el-form-item>
      <el-form-item label="当前价值" prop="currentValue">
        <el-input-number
          v-model="newFormInline.currentValue"
          :min="0"
          :precision="2"
        />
      </el-form-item>
    </div>

    <div class="flex">
      <el-form-item label="月折旧" prop="monthlyDepreciation">
        <el-input-number
          v-model="newFormInline.monthlyDepreciation"
          :min="0"
          :precision="2"
        />
      </el-form-item>
      <el-form-item label="自动折旧" prop="isAuto">
        <el-switch
          v-model="newFormInline.isAuto"
          inline-prompt
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>
    </div>

    <el-form-item label="状态" prop="status">
      <el-switch
        v-model="newFormInline.status"
        inline-prompt
        active-text="正常"
        inactive-text="闲置"
      />
    </el-form-item>

    <el-form-item label="备注" prop="desc">
      <el-input
        v-model="newFormInline.desc"
        placeholder="请输入备注"
        type="textarea"
        clearable
        maxlength="200"
        show-word-limit
      />
    </el-form-item>
  </el-form>
</template>

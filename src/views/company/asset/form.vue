<script setup lang="ts">
import { ref } from "vue";

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

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" label-width="82px">
    <el-form-item
      label="资产名称"
      prop="name"
      :rules="[{ required: true, message: '请输入资产名称', trigger: 'blur' }]"
    >
      <el-input
        v-model="newFormInline.name"
        placeholder="请输入资产名称"
        clearable
      />
    </el-form-item>

    <el-form-item label="资产类型" prop="type">
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
      />
    </el-form-item>
  </el-form>
</template>

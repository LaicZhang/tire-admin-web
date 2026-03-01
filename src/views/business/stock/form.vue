<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  formInline: {
    type: Object,
    default: () => ({
      uid: undefined,
      tireName: "",
      repoName: "",
      batchNo: "",
      systemCount: 0,
      actualCount: 0
    })
  }
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const diff = computed(() => {
  return newFormInline.value.actualCount - newFormInline.value.systemCount;
});

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="newFormInline" label-width="82px">
    <el-form-item label="轮胎">
      <el-input v-model="newFormInline.tireName" disabled />
    </el-form-item>
    <el-form-item label="仓库">
      <el-input v-model="newFormInline.repoName" disabled />
    </el-form-item>
    <el-form-item label="批次">
      <el-input v-model="newFormInline.batchNo" disabled />
    </el-form-item>
    <el-form-item label="系统库存">
      <el-input-number v-model="newFormInline.systemCount" disabled />
    </el-form-item>
    <el-form-item
      label="实际库存"
      prop="actualCount"
      :rules="[
        { required: true, message: '请输入实际库存', trigger: 'blur' },
        {
          trigger: 'blur',
          validator: (_rule, value, callback) => {
            if (value === null || value === undefined || value === '')
              return callback();
            const n = typeof value === 'number' ? value : Number(value);
            if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n))
              return callback(new Error('实际库存需为不小于 0 的整数'));
            callback();
          }
        }
      ]"
    >
      <el-input-number v-model="newFormInline.actualCount" :min="0" />
    </el-form-item>

    <el-form-item label="差异">
      <span :class="diff < 0 ? 'text-red-500' : 'text-green-500'">{{
        diff
      }}</span>
      <span v-if="diff > 0" class="text-xs text-gray-400 ml-2">
        (盘盈: 将增加 {{ diff }} 个库存)</span
      >
      <span v-if="diff < 0" class="text-xs text-gray-400 ml-2">
        (盘亏: 将减少 {{ Math.abs(diff) }} 个库存)</span
      >
    </el-form-item>
  </el-form>
</template>

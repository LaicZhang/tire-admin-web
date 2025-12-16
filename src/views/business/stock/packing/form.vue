<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  formInline: {
    type: Object,
    default: () => ({
      code: "",
      remark: ""
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
    <el-form-item label="装箱单号" prop="code">
      <el-input
        v-model="newFormInline.code"
        clearable
        placeholder="如果不填将自动生成"
      />
    </el-form-item>

    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="newFormInline.remark"
        type="textarea"
        placeholder="请输入备注信息"
        :rows="3"
      />
    </el-form-item>
  </el-form>
</template>

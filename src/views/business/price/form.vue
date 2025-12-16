<script setup lang="ts">
import { ref, reactive } from "vue";

interface FormProps {
  formInline: {
    id?: string;
    name: string;
    desc?: string;
    type: string;
  };
}

const props = defineProps<FormProps>();

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const formRules = reactive({
  name: [{ required: true, message: "名称为必填项", trigger: "blur" }],
  type: [{ required: true, message: "类型为必填项", trigger: "change" }]
});

// Expose ref for validation
defineExpose({ getRef: () => ruleFormRef.value });
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
        placeholder="请输入价目表名称"
      />
    </el-form-item>

    <el-form-item label="类型" prop="type">
      <el-select v-model="newFormInline.type" placeholder="请选择类型">
        <el-option label="系统" value="SYSTEM" />
        <el-option label="自定义" value="CUSTOM" />
      </el-select>
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

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";

defineOptions({
  name: "FeedbackForm"
});

interface FeedbackFormProps {
  formInline?: {
    uid?: string;
    content?: string;
    rating?: number;
    status?: number;
    type?: number;
  };
}

const props = withDefaults(defineProps<FeedbackFormProps>(), {
  formInline: () => ({
    content: "",
    rating: undefined,
    status: 0,
    type: 0
  })
});

const formRef = ref<FormInstance>();
const formRules = reactive<FormRules>({
  content: [{ required: true, message: "反馈内容为必填项", trigger: "blur" }]
});

const formData = ref(props.formInline);

const getRef = () => formRef.value;

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="100px"
  >
    <el-form-item label="反馈内容" prop="content">
      <el-input
        v-model="formData.content"
        type="textarea"
        :rows="4"
        placeholder="请输入反馈内容"
      />
    </el-form-item>
    <el-form-item label="评分" prop="rating">
      <el-input-number
        v-model="formData.rating"
        :min="1"
        :max="5"
        placeholder="请输入评分（1-5）"
      />
    </el-form-item>
    <el-form-item label="状态" prop="status">
      <el-select v-model="formData.status" placeholder="请选择状态">
        <el-option label="待处理" :value="0" />
        <el-option label="处理中" :value="1" />
        <el-option label="已处理" :value="2" />
      </el-select>
    </el-form-item>
    <el-form-item label="类型" prop="type">
      <el-select v-model="formData.type" placeholder="请选择类型">
        <el-option label="建议" :value="0" />
        <el-option label="问题" :value="1" />
        <el-option label="其他" :value="2" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

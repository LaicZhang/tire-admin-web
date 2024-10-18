<script setup lang="ts">
import { ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { PurchaseFormProps } from "./props/purchase";

const props = withDefaults(defineProps<PurchaseFormProps>(), {
  formInline: () => ({
    uid: "",
    id: 0
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "角色名称为必填项", trigger: "blur" }]
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

    <el-form-item label="地址" prop="address">
      <el-input
        v-model="newFormInline.address"
        clearable
        placeholder="请输入地址"
      />
    </el-form-item>

    <el-form-item label="启用时间" prop="startAt">
      <el-date-picker
        v-model="newFormInline.startAt"
        clearable
        type="datetime"
        placeholder="请输入启用时间"
      />
    </el-form-item>

    <el-form-item label="停用时间" prop="endAt">
      <el-date-picker
        v-model="newFormInline.endAt"
        clearable
        type="datetime"
        placeholder="请输入停用时间"
      />
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="newFormInline.desc"
        placeholder="请输入备注信息"
        type="textarea"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";
import ReCol from "@/components/ReCol";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    type: "get",
    module: "",
    path: "",
    desc: "",
    belong: 1
  })
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
    <el-row :gutter="30">
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="方法" prop="type">
          <el-select v-model="newFormInline.type" class="w-full">
            <el-option label="get" value="get" />
            <el-option label="post" value="post" />
            <el-option label="patch" value="patch" />
            <el-option label="delete" value="delete" />
          </el-select>
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="模块" prop="module">
          <el-input
            v-model="newFormInline.module"
            clearable
            placeholder="例如 user / employee / order"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="Path" prop="path">
          <el-input
            v-model="newFormInline.path"
            clearable
            placeholder="例如 /user 或 /user/page"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="归属" prop="belong">
          <el-select v-model="newFormInline.belong" class="w-full">
            <el-option label="个人(1)" :value="1" />
            <el-option label="部门(2)" :value="2" />
          </el-select>
        </el-form-item>
      </re-col>
      <re-col :value="24" :xs="24" :sm="24">
        <el-form-item label="描述" prop="desc">
          <el-input
            v-model="newFormInline.desc"
            type="textarea"
            :rows="3"
            clearable
            placeholder="请输入描述"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>

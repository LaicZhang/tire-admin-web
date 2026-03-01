<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormRules } from "element-plus";
import type { FormItemProps, FormProps } from "./table";
import { useSysDictOptions } from "@/composables/useSysDict";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: undefined,
    id: undefined,
    uid: undefined,
    desc: undefined,
    principalName: undefined,
    principalPhone: undefined,
    province: undefined,
    city: undefined
  })
});

/** 自定义表单规则校验 */
const formRules: FormRules = reactive({
  name: [{ required: true, message: "公司名称为必填项", trigger: "blur" }],
  principalPhone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号码",
      trigger: "blur"
    }
  ]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const { options: provinceOptions } = useSysDictOptions("province");
const { options: cityOptions } = useSysDictOptions("city");

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
    label-width="90px"
  >
    <el-row :gutter="20">
      <el-col :span="24">
        <el-form-item label="公司名称" prop="name">
          <el-input
            v-model="newFormInline.name"
            clearable
            placeholder="请输入公司名称"
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="负责人" prop="principalName">
          <el-input
            v-model="newFormInline.principalName"
            clearable
            placeholder="请输入负责人姓名"
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="联系电话" prop="principalPhone">
          <el-input
            v-model="newFormInline.principalPhone"
            clearable
            placeholder="请输入联系电话"
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="省份" prop="province">
          <el-select
            v-model="newFormInline.province"
            filterable
            clearable
            allow-create
            default-first-option
            placeholder="请选择或输入省份"
            class="w-full"
          >
            <el-option
              v-for="item in provinceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="城市" prop="city">
          <el-select
            v-model="newFormInline.city"
            filterable
            clearable
            allow-create
            default-first-option
            placeholder="请选择或输入城市"
            class="w-full"
          >
            <el-option
              v-for="item in cityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="24">
        <el-form-item label="备注" prop="desc">
          <el-input
            v-model="newFormInline.desc"
            placeholder="请输入备注信息"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

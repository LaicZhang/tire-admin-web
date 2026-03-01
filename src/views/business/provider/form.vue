<script setup lang="ts">
import { ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { useOptionsByType } from "@/composables/useOptions";
import { useSysDictOptions } from "@/composables/useSysDict";

interface FormItemProps {
  id: number;
  uid: string;
  name: string;
  desc?: string;
  operatorId: string;
  isIndividual: boolean;
  isPublic: boolean;
  contactName: string;
  province: string;
  status: boolean;
  initialPayable?: number;
}

interface FormProps {
  formInline?: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    uid: "",
    name: "",
    id: 0,
    desc: "",
    operatorId: "",
    isIndividual: false,
    isPublic: false,
    contactName: "",
    province: "",
    status: true,
    initialPayable: 0
  })
});
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "名称为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const { options: employeeOptions } = useOptionsByType("employees");
const { options: provinceOptions } = useSysDictOptions("province");

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
    <el-form-item label="供应商名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入供应商名称"
      />
    </el-form-item>

    <el-form-item label="联系人" prop="contactName">
      <el-input
        v-model="newFormInline.contactName"
        clearable
        placeholder="请输入联系人"
      />
    </el-form-item>

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

    <el-form-item label="操作人" prop="operatorId">
      <el-select
        v-model="newFormInline.operatorId"
        placeholder="请选择操作人"
        filterable
        clearable
        class="w-full"
      >
        <el-option
          v-for="item in employeeOptions"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-switch v-model="newFormInline.status" />
    </el-form-item>

    <el-form-item label="是否公开" prop="isPublic">
      <el-switch v-model="newFormInline.isPublic" />
    </el-form-item>

    <el-form-item label="期初欠款" prop="initialPayable">
      <el-input-number
        v-model="newFormInline.initialPayable"
        :min="0"
        :step="100"
        style="width: 100%"
        placeholder="请输入期初应付款"
        :disabled="!!newFormInline.uid"
      />
      <div class="text-xs text-gray-400 mt-1">
        仅新建供应商时可设置，后期请通过财务调整
      </div>
    </el-form-item>

    <el-form-item label="是否个人" prop="isIndividual">
      <el-switch v-model="newFormInline.isIndividual" />
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

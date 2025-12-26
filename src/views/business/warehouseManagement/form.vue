<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormRules } from "element-plus";
import { getEmployeeListApi, type Employee } from "@/api/company/employee";
import { message } from "@/utils";

interface FormItemProps {
  uid?: string;
  name: string;
  address?: string;
  managerId?: string;
  desc?: string;
  status: boolean;
}

interface FormProps {
  formInline?: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    uid: undefined,
    name: "",
    address: "",
    managerId: undefined,
    desc: "",
    status: true
  })
});

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "仓库名称为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
const employeeList = ref<Employee[]>([]);

const getEmployees = async () => {
  const { data, code, msg } = await getEmployeeListApi(0); // 0 for all if API supports it, or handle pagination
  if (code === 200) {
    employeeList.value = data.list || [];
  } else {
    // message(msg, { type: "error" });
    // Suppress initial loading error or handle it
  }
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });

onMounted(async () => {
  await getEmployees();
});
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="仓库名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入仓库名称"
      />
    </el-form-item>

    <el-form-item label="仓库地址" prop="address">
      <el-input
        v-model="newFormInline.address"
        clearable
        placeholder="请输入仓库地址"
      />
    </el-form-item>

    <el-form-item label="负责人" prop="managerId">
      <el-select
        v-model="newFormInline.managerId"
        clearable
        placeholder="请选择负责人"
      >
        <el-option
          v-for="item in employeeList"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-switch v-model="newFormInline.status" />
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

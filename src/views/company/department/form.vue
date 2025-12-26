<script setup lang="ts">
import { onMounted, ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { ALL_LIST, localForage, message } from "@/utils";
import { getEmployeeListApi } from "@/api";
import { FormProps } from "./table";
import type { Employee } from "@/api/company/employee";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    desc: "",
    managers: [] as string[],
    employees: [] as string[]
  })
});

const allEmployeeList = ref<Employee[]>([]);
const getAllEmployeeList = async () => {
  const { data, code, msg } = await getEmployeeListApi(0);
  if (code === 200) {
    allEmployeeList.value = data.list;
    await localForage().setItem(ALL_LIST.employee, data.list);
  } else message(msg, { type: "error" });
};

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
onMounted(async () => {
  await getAllEmployeeList();
});
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

    <el-form-item label="管理者">
      <el-select v-model="newFormInline.managers" multiple>
        <el-option
          v-for="manager in allEmployeeList"
          :key="manager.id"
          :label="manager.name"
          :value="manager.uid"
        >
          {{ manager.name }}
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="员工">
      <el-select v-model="newFormInline.employees" multiple>
        <el-option
          v-for="employee in allEmployeeList"
          :key="employee.id"
          :label="employee.name"
          :value="employee.uid"
        >
          {{ employee.name }}
        </el-option>
      </el-select>
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

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { FormRules } from "element-plus";
import { getAllEmployeeApi, type Employee } from "@/api/company/employee";

export interface FormItemProps {
  uid?: string;
  employeeId: string;
  /** YYYYMM number or string from inputs */
  date: number | string;
  /** yuan strings for form UX; converted to fen on submit */
  baseYuan: string;
  performanceYuan: string;
  fulltimeAttendanceAwardYuan: string;
  subsidyYuan: string;
  otherYuan: string;
  personalTaxYuan: string;
  companyPensionYuan: string;
  desc?: string;
  confirmedAt?: string | null;
}

interface FormProps {
  formInline?: FormItemProps;
  readonly?: boolean;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    uid: "",
    employeeId: "",
    date: "",
    baseYuan: "0",
    performanceYuan: "0",
    fulltimeAttendanceAwardYuan: "0",
    subsidyYuan: "0",
    otherYuan: "0",
    personalTaxYuan: "0",
    companyPensionYuan: "0",
    desc: ""
  }),
  readonly: false
});

const formRules = reactive<FormRules>({
  employeeId: [{ required: true, message: "员工为必填项", trigger: "change" }],
  date: [{ required: true, message: "月份(YYYYMM)为必填项", trigger: "blur" }],
  baseYuan: [{ required: true, message: "基本工资为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
const employees = ref<Employee[]>([]);

onMounted(async () => {
  try {
    const res = await getAllEmployeeApi({ scope: "active" });
    employees.value = res.data ?? [];
  } catch {
    employees.value = [];
  }
});

defineExpose({ formRef: ruleFormRef, formInline: newFormInline });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="110px"
    :disabled="readonly || Boolean(newFormInline.confirmedAt)"
  >
    <el-form-item label="员工" prop="employeeId">
      <el-select
        v-model="newFormInline.employeeId"
        filterable
        clearable
        placeholder="请选择员工"
        class="w-full"
      >
        <el-option
          v-for="emp in employees"
          :key="emp.uid"
          :label="emp.name"
          :value="emp.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="月份" prop="date">
      <el-input
        v-model="newFormInline.date"
        clearable
        placeholder="例如 202607"
      />
    </el-form-item>

    <el-form-item label="基本工资(元)" prop="baseYuan">
      <el-input v-model="newFormInline.baseYuan" clearable placeholder="0.00" />
    </el-form-item>

    <el-form-item label="绩效(元)" prop="performanceYuan">
      <el-input
        v-model="newFormInline.performanceYuan"
        clearable
        placeholder="0.00"
      />
    </el-form-item>

    <el-form-item label="全勤奖(元)">
      <el-input
        v-model="newFormInline.fulltimeAttendanceAwardYuan"
        clearable
        placeholder="0.00"
      />
    </el-form-item>

    <el-form-item label="补贴(元)">
      <el-input
        v-model="newFormInline.subsidyYuan"
        clearable
        placeholder="0.00"
      />
    </el-form-item>

    <el-form-item label="其他(元)">
      <el-input
        v-model="newFormInline.otherYuan"
        clearable
        placeholder="0.00"
      />
    </el-form-item>

    <el-form-item label="个税(元)">
      <el-input
        v-model="newFormInline.personalTaxYuan"
        clearable
        placeholder="0.00"
      />
    </el-form-item>

    <el-form-item label="公司养老(元)">
      <el-input
        v-model="newFormInline.companyPensionYuan"
        clearable
        placeholder="0.00"
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

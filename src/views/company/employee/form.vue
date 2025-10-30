<script setup lang="ts">
import { onMounted, ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { ALL_LIST, localForage, message, SYS } from "@/utils";
import { FormProps } from "./table";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    phone: undefined,
    email: undefined,
    status: 0,
    username: undefined,
    password: undefined,
    name: undefined,
    nickname: undefined,
    uid: undefined,
    id: undefined,
    desc: undefined,
    jobs: []
  })
});

const allPositionList = ref([]);
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "真实姓名为必填项", trigger: "blur" }],
  phone: [
    // { required: true, message: "手机号为必填项", trigger: "blur" },
    {
      pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
      message: "请输入手机号",
      trigger: "blur"
    }
  ],
  username: [{ required: true, message: "用户名为必填项", trigger: "blur" }],
  nickname: [{ required: true, message: "昵称为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

const employeeStatus = ref([]);
const getEmployeeStatus = async () => {
  const dict: any = await localForage().getItem(SYS.dict);
  employeeStatus.value = dict.employeeStatus;
};

async function getPositionList() {
  allPositionList.value = await localForage().getItem(ALL_LIST.position);
}

defineExpose({ getRef });
onMounted(async () => {
  await Promise.all([getPositionList(), getEmployeeStatus()]);
});
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="用户名" prop="username">
      <el-input
        v-model="newFormInline.username"
        disabled
        placeholder="请输入用户名"
      />
    </el-form-item>

    <el-form-item label="真实姓名" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入真实姓名"
      />
    </el-form-item>

    <el-form-item label="昵称" prop="nickname">
      <el-input
        v-model="newFormInline.nickname"
        clearable
        placeholder="请输入昵称"
      />
    </el-form-item>

    <el-form-item label="手机号码" prop="phone">
      <el-input
        v-model="newFormInline.phone"
        clearable
        placeholder="请输入手机号码"
      />
    </el-form-item>

    <el-form-item label="电子邮件" prop="email">
      <el-input
        v-model="newFormInline.email"
        clearable
        placeholder="请输入电子邮件"
      />
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-select
        v-model="newFormInline.status"
        placeholder="请输入员工状态"
        clearable
        class="w-[180px]!"
      >
        <el-option
          v-for="item in employeeStatus"
          :key="item.id"
          :value="item.key"
          :label="item.cn"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="岗位" prop="jobs">
      <el-checkbox-group v-model="newFormInline.jobs">
        <el-checkbox
          v-for="item in allPositionList"
          :key="item.id"
          :value="item"
        >
          {{ item.cn }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <el-form-item label="密码" prop="password">
      <el-input
        v-model="newFormInline.password"
        clearable
        placeholder="请输入密码"
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

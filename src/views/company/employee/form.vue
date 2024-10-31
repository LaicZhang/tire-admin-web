<script setup lang="ts">
import { onMounted, ref } from "vue";
import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { localForage } from "@/utils";

interface FormItemProps {
  phone: string;
  email: string;
  username: string;
  password: string;
  name: string;
  id: number;
  uid: string;
  desc?: string;
  nickname?: string;
  jobs: any[];
}

interface FormProps {
  formInline: FormItemProps;
}

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    phone: "",
    email: "",
    username: "",
    password: "",
    name: "",
    nickname: "",
    uid: "",
    id: 0,
    desc: undefined,
    jobs: []
  })
});

const allPositionList = ref([]);
/** 自定义表单规则校验 */
const formRules = reactive({
  name: [{ required: true, message: "真实姓名为必填项", trigger: "blur" }],
  phone: [{ required: true, message: "手机号为必填项", trigger: "blur" }],
  username: [{ required: true, message: "用户名为必填项", trigger: "blur" }]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

async function getPositionList() {
  allPositionList.value = await localForage().getItem("positions");
}

defineExpose({ getRef });
onMounted(async () => {
  await getPositionList();
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
        clearable
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

    <el-form-item label="初始密码" prop="password">
      <el-input
        v-model="newFormInline.password"
        clearable
        placeholder="请输入初始密码"
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

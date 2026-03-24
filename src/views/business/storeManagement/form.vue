<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { FormRules } from "element-plus";
import { getRepoListApi, type Repo } from "@/api/company/repo";
import type { FormProps } from "./types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    uid: undefined,
    name: "",
    address: "",
    defaultRepositoryId: undefined,
    desc: "",
    status: true
  })
});

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "门店名称为必填项", trigger: "blur" }],
  defaultRepositoryId: [
    { required: true, message: "请选择默认仓库", trigger: "change" }
  ]
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
const repoList = ref<Repo[]>([]);

async function loadRepos() {
  const { data, code } = await getRepoListApi(0);
  if (code === 200) {
    repoList.value = data?.list || [];
  }
}

defineExpose({ formRef: ruleFormRef });

onMounted(async () => {
  await loadRepos();
});
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="96px"
  >
    <el-form-item label="门店名称" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入门店名称"
      />
    </el-form-item>

    <el-form-item label="默认仓库" prop="defaultRepositoryId">
      <el-select
        v-model="newFormInline.defaultRepositoryId"
        clearable
        placeholder="请选择默认仓库"
        class="w-full"
      >
        <el-option
          v-for="item in repoList"
          :key="item.uid"
          :label="item.name"
          :value="item.uid"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="门店地址" prop="address">
      <el-input
        v-model="newFormInline.address"
        clearable
        placeholder="请输入门店地址"
      />
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

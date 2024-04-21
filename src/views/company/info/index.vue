<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getCompanyApi } from "@/api";
import { message } from "@/utils/message";
defineOptions({
  name: "companyInfo"
});

const companyInfoRef = ref({});
const cid = ref("");
const getCompanyInfo = async () => {
  const res = await getCompanyApi(cid.value);
  if (res.code === 200) companyInfoRef.value = res.data;
  else message(res.message, { type: "error" });
};
const columns = [
  {
    label: "ID",
    value: "12345"
  },
  {
    label: "管理人",
    value: "明明"
  },
  {
    label: "创建时间",
    value: "createAt"
  },
  {
    label: "更新时间",
    value: "updateAt"
  }
];
onMounted(async () => {
  await getCompanyInfo();
});
</script>

<template>
  <el-card class="m-2">
    <PureDescriptions border :title="$route.meta.title" :columns="columns" />
  </el-card>
</template>

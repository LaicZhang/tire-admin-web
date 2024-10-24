<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getCompanyApi } from "@/api";
import { message } from "@/utils/message";
import { columns } from "./columns";

defineOptions({
  name: "companyInfo"
});

const companyInfoRef = ref();
const data = ref([]);

const getCompanyInfo = async () => {
  const res = await getCompanyApi();
  if (res.code === 200) companyInfoRef.value = res.data;
  else message(res.message, { type: "error" });
  data.value = [res.data];
};

onMounted(async () => {
  await getCompanyInfo();
});
</script>

<template>
  <el-card class="m-1">
    <PureDescriptions
      border
      :data
      :title="$route.meta.title"
      :columns
      column="2"
    />
  </el-card>
</template>

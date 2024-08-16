<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getCompanyApi } from "@/api";
import { message } from "@/utils/message";
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
const columns = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "公司名称",
    prop: "name"
  },
  {
    label: "状态",
    prop: "status"
  },
  {
    label: "负责人",
    prop: "principalName"
  },
  {
    label: "负责人电话",
    prop: "principalPhone"
  },
  {
    label: "所在省",
    prop: "province"
  },
  {
    label: "所在市",
    prop: "city"
  },
  {
    label: "创建时间",
    prop: "createAt"
  },
  {
    label: "更新时间",
    prop: "updateAt"
  }
];

onMounted(async () => {
  await getCompanyInfo();
});
</script>

<template>
  <el-card class="m-2">
    <PureDescriptions
      border
      :data
      :title="$route.meta.title"
      :columns="columns"
    />
  </el-card>
</template>

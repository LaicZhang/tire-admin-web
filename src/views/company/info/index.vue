<script setup lang="ts">
import { onMounted, ref, h } from "vue";
import { getCompanyInfoApi } from "@/api";
import { message } from "@/utils/message";
import { useColumns } from "./columns";
import { openDialog } from "./table";

defineOptions({
  name: "companyInfo"
});
const { columns } = useColumns();
const companyInfoRes = ref([]);

const getCompanyInfo = async () => {
  const { data, code, msg } = await getCompanyInfoApi("only-info");
  if (code === 200) companyInfoRes.value = [data];
  else message(msg, { type: "error" });
};

onMounted(async () => {
  await getCompanyInfo();
});
</script>

<template>
  <el-card class="m-1">
    <PureDescriptions
      border
      :data="companyInfoRes"
      :title="$route.meta.title"
      :columns
      :column="2"
    >
      <template #extra>
        <el-button type="primary" @click="() => openDialog()">更新</el-button>
      </template>
    </PureDescriptions>
  </el-card>
</template>

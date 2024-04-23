<script setup lang="ts">
import { getLogApi } from "@/api";
import { onMounted, ref } from "vue";
import { useColumns } from "./columns";

defineOptions({
  name: "history"
});

const tableRef = ref();
const {
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  adaptiveConfig,
  onSizeChange,
  onCurrentChange
} = useColumns();
const index = ref(1);
const type = ref(1);
async function getHistory() {
  dataList.value = [];
  let params;

  if (type.value === 1) {
    params = { loginAt: null };
  } else if (type.value === 2) {
    params = { operationAt: null };
  }
  const { data, code } = await getLogApi(index.value, params);
  handleApiResponse({ data, code });
}

async function handleApiResponse({ data, code }) {
  if (code === 200) {
    dataList.value = data.list;
    pagination.total = data.count;
    loading.value = false;
  }
}

onMounted(async () => {
  await getHistory();
});
</script>

<template>
  <div class="mb-2 items-center text-sm">
    <el-card>
      <el-radio-group v-model="type" @change="getHistory">
        <el-radio :value="1">登录记录</el-radio>
        <el-radio :value="2">操作记录</el-radio>
        <el-radio :value="3">其他记录</el-radio>
      </el-radio-group>
    </el-card>

    <el-divider />
    <pure-table
      ref="tableRef"
      border
      adaptive
      :adaptiveConfig="adaptiveConfig"
      row-key="id"
      alignWhole="center"
      showOverflowTooltip
      :loading="loading"
      :loading-config="loadingConfig"
      :data="dataList"
      :columns="columns"
      :pagination="pagination"
      @page-size-change="onSizeChange"
      @page-current-change="onCurrentChange"
    />
  </div>
</template>

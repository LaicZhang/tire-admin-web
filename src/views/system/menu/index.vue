<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import { getMenuListApi } from "@/api/system/menu";
import { message } from "@/utils";

defineOptions({
  name: "MenuManagement"
});

const dataList = ref([]);
const loading = ref(false);
const pagination = ref({
  total: 0,
  pageSize: 999, // Tree usually shows all
  currentPage: 1,
  background: true
});

const columns = [
  {
    label: "菜单名称",
    prop: "meta.title"
  },
  {
    label: "路由路径",
    prop: "path"
  },
  {
    label: "图标",
    prop: "meta.icon"
  },
  {
    label: "排序",
    prop: "meta.rank"
  }
];

const getData = async () => {
  loading.value = true;
  // Mocking response for now or call API
  // const { data, code, msg } = await getMenuListApi();
  // Assuming backend returns tree
  loading.value = false;
  message("菜单管理功能需后端接口支持树形结构，暂展示空列表", { type: "info" });
};

onMounted(() => {
  getData();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <PureTableBar title="菜单管理" @refresh="getData">
        <template #buttons>
          <el-button type="primary" :icon="useRenderIcon(AddFill)">
            新增菜单
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="path"
            adaptive
            :size="size"
            :columns="columns"
            border
            :data="dataList"
            :pagination="{ ...pagination, size }"
          />
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

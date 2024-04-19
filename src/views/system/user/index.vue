<script setup lang="ts">
import { onMounted, ref } from "vue";
// https://plus-pro-components.com/components/search.html
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { useColumns } from "./columns";
import { getOneUserApi, getUsersApi } from "@/api";
import { PureTableBar } from "@/components/RePureTableBar";

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

defineOptions({
  name: "user"
});
const state = ref({
  status: "0",
  time: new Date().toString()
});

const formColumns: PlusColumn[] = [
  {
    label: "uid",
    prop: "uid"
  },
  {
    label: "用户名",
    prop: "username"
  },
  {
    label: "电话",
    prop: "phone"
  },
  {
    label: "邮箱",
    prop: "email"
  },
  {
    label: "状态",
    prop: "status",
    valueType: "select",
    options: [
      {
        label: "未解决",
        value: "0",
        color: "red"
      },
      {
        label: "已解决",
        value: "1",
        color: "blue"
      },
      {
        label: "解决中",
        value: "2",
        color: "yellow"
      },
      {
        label: "失败",
        value: "3",
        color: "red"
      }
    ]
  }
];

const handleChange = () => {
  console.log("change");
};
const handleSearch = async () => {
  const { code, data } = await getUsersApi();

  if (code === 200) {
    dataList.value = data.list;
    pagination.total = data.count;
  }
  loading.value = false;
};
const handleRest = () => {
  console.log("handleRest");
};
const getDetails = async row => {
  loading.value = true;
  const { data, code, message } = await getOneUserApi(row.uid);
};
const updateOne = row => {
  loading.value = true;
};
const deleteOne = row => {
  loading.value = true;
};

onMounted(async () => {
  await handleSearch();
});
</script>

<template>
  <el-card class="m-2">
    <PlusSearch
      v-model="state"
      :columns="formColumns"
      :show-number="2"
      label-width="80"
      label-position="right"
      @change="handleChange"
      @search="handleSearch"
      @reset="handleRest"
    />
  </el-card>

  <el-card class="m-2">
    <PureTableBar :title="$route.meta.title">
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
      >
        <template #operation="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            @click.prevent="getDetails(row)"
          >
            详情
          </el-button>
          <el-button
            link
            type="primary"
            size="small"
            @click.prevent="updateOne(row)"
          >
            更新
          </el-button>
          <el-button
            link
            type="danger"
            size="small"
            @click.prevent="deleteOne(row)"
          >
            删除
          </el-button>
        </template>
      </pure-table>
    </PureTableBar>
  </el-card>
</template>

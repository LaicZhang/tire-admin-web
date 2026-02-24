<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getUnitListApi,
  createUnitApi,
  deleteUnitApi,
  type Unit
} from "@/api/business/unit";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";
import UnitForm from "./UnitForm.vue";

defineOptions({
  name: "Unit"
});

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange
} = useCrud<
  Unit,
  CommonResult<{ list: Unit[]; count: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getUnitListApi(page) as Promise<
      CommonResult<{ list: Unit[]; count: number }>
    >,
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  },
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "加载失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.count ?? 0
    };
  },
  immediate: true
});

const columns = [
  {
    label: "单位名称",
    prop: "name"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];

const handleDelete = async (row: Unit) => {
  await deleteUnitApi(row.id);
  message("删除成功", { type: "success" });
  getData();
};

function openDialog() {
  addDialog({
    title: "新增计量单位",
    props: {
      name: ""
    },
    width: "30%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(UnitForm, {
        name: (options.props as { name: string }).name,
        "onUpdate:name": (val: string) => {
          (options.props as { name: string }).name = val;
        }
      }),
    beforeSure: (done, { options }) => {
      const props = options.props as { name: string };
      const name = props.name;
      if (!name) {
        message("请输入名称", { type: "warning" });
        return;
      }
      createUnitApi({ name }).then(() => {
        message("创建成功", { type: "success" });
        done();
        getData();
      });
    }
  });
}
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <PureTableBar title="计量单位管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增单位
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size="size"
            :columns="columns"
            border
            :data="dataList"
            :loading="loading"
            :pagination="{ ...pagination, size }"
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <DeleteButton @confirm="handleDelete(row)" />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

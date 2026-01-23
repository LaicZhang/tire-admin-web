<script setup lang="ts">
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getRepoZoneListApi,
  createRepoZoneApi,
  deleteRepoZoneApi,
  type Zone
} from "@/api/business/stock";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

defineOptions({
  name: "StockLocation"
});

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange
} = useCrud<
  Zone,
  CommonResult<{ list: Zone[]; count: number }>,
  { page: number; pageSize: number }
>({
  api: ({ page }) =>
    getRepoZoneListApi(page) as Promise<
      CommonResult<{ list: Zone[]; count: number }>
    >,
  pagination: {
    total: 0,
    pageSize: 10,
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
    label: "库区名称",
    prop: "name"
  },
  {
    label: "所属仓库",
    prop: "repoName"
  },
  {
    label: "货位数量",
    prop: "binCount"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];

const handleDelete = async (row: Zone) => {
  await deleteRepoZoneApi(String(row.id));
  message("删除成功", { type: "success" });
  getData();
};

function openDialog(title = "新增", row?: unknown) {
  addDialog({
    title: `${title}库区`,
    props: {
      name: "",
      repoId: ""
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      return h("div", [
        h("el-form", {}, [
          h("el-form-item", { label: "仓库ID" }, [
            h("el-input", {
              modelValue: options.props.repoId,
              "onUpdate:modelValue": (val: string) =>
                (options.props.repoId = val),
              placeholder: "请输入仓库ID (后期改为下拉)"
            })
          ]),
          h("el-form-item", { label: "库区名称" }, [
            h("el-input", {
              modelValue: options.props.name,
              "onUpdate:modelValue": (val: string) =>
                (options.props.name = val),
              placeholder: "例如：A区"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const data = {
        name: options.props.name,
        repoId: options.props.repoId
      };
      createRepoZoneApi(data).then(() => {
        message("操作成功", { type: "success" });
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
      <PureTableBar title="库区管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增库区
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

    <!-- Note: Bin Management would logically be a sub-view or drill-down. 
         For simplicity in this batch, we assume it's managed under Zone or separate tab.
         Here we only implemented Zone list first. -->
  </div>
</template>

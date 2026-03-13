<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
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
import { columns } from "./columns";
import RepoSelect from "@/components/EntitySelect/RepoSelect.vue";

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

const handleDelete = async (row: Zone) => {
  await deleteRepoZoneApi(String(row.id));
  message("删除成功", { type: "success" });
  getData();
};

type DialogProps = { name: string; repoId: string };

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
      const dialogProps = options.props as DialogProps;
      return h("div", [
        h("el-form", {}, [
          h("el-form-item", { label: "仓库" }, [
            h(RepoSelect, {
              modelValue: dialogProps.repoId,
              "onUpdate:modelValue": (val: string) =>
                (dialogProps.repoId = val),
              placeholder: "请选择仓库"
            })
          ]),
          h("el-form-item", { label: "库区名称" }, [
            h("el-input", {
              modelValue: dialogProps.name,
              "onUpdate:modelValue": (val: string) => (dialogProps.name = val),
              placeholder: "例如：A区"
            })
          ])
        ])
      ]);
    },
    beforeSure: (done, { options }) => {
      const dialogProps = options.props as DialogProps;
      dialogProps.repoId = String(dialogProps.repoId || "").trim();
      dialogProps.name = String(dialogProps.name || "").trim();
      if (!dialogProps.repoId) {
        message("请选择仓库", { type: "warning" });
        return;
      }
      if (!dialogProps.name) {
        message("请输入库区名称", { type: "warning" });
        return;
      }
      if (dialogProps.name.length > 50) {
        message("库区名称最多 50 个字符", { type: "warning" });
        return;
      }
      const data = {
        name: dialogProps.name,
        repoId: dialogProps.repoId
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

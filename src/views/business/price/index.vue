<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "../../../utils/constants";
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteButton from "@/components/DeleteButton/index.vue";
import {
  getPriceListListApi,
  createPriceListApi,
  updatePriceListApi,
  deletePriceListApi
} from "@/api/business/price";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import Form from "./form.vue";
import { useCrud } from "@/composables";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import type { PriceList } from "@/api/business/price";

defineOptions({
  name: "PriceList"
});

const form = ref({
  name: undefined as string | undefined
});

const {
  loading,
  dataList,
  pagination,
  fetchData: getData,
  onCurrentChange
} = useCrud<
  PriceList,
  CommonResult<PaginatedResponseDto<PriceList>>,
  { page: number; pageSize: number }
>({
  api: ({ page }) => getPriceListListApi(page, form.value),
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
      total: res.data?.count ?? res.data?.total ?? 0
    };
  },
  immediate: true
});

const columns = [
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "类型",
    prop: "type",
    cellRenderer: ({ row }: { row: PriceList }) => {
      const map: Record<string, string> = { SYSTEM: "系统", CUSTOM: "自定义" };
      return map[String(row.type)] || row.type;
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  getData();
};

const handleDelete = async (row: PriceList) => {
  await deletePriceListApi(row.uid);
  message("删除成功", { type: "success" });
  getData();
};

type FormInline = { id?: string; name: string; desc: string; type: string };

function openDialog(title = "新增", row?: PriceList) {
  addDialog({
    title: `${title}价目表`,
    props: {
      formInline: {
        id: row?.uid,
        name: row?.name ?? "",
        desc: row?.desc ?? "",
        type: row?.type ?? "CUSTOM"
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(Form, {
        formInline: (options.props as { formInline: FormInline }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = (options.props as { formInline: FormInline }).formInline;
      const promise =
        title === "新增"
          ? createPriceListApi(
              curData as Parameters<typeof createPriceListApi>[0]
            )
          : updatePriceListApi(
              curData.id!,
              curData as Parameters<typeof updatePriceListApi>[1]
            );

      promise.then(() => {
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
      <el-form
        :inline="true"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-3 overflow-auto"
      >
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            :loading="loading"
            @click="handleSearch"
          >
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="m-1">
      <PureTableBar title="价目表管理" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增价目表
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
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <DeleteButton @confirm="handleDelete(row)" />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

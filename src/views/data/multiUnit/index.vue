<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import type { MultiUnitItem, UnitOption } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import DeleteButton from "@/components/DeleteButton/index.vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getMultiUnitListApi,
  createMultiUnitApi,
  updateMultiUnitApi,
  deleteMultiUnitApi,
  getAllSingleUnitsApi
} from "@/api/data/category";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useCrud } from "@/composables";
import Form from "./form.vue";

defineOptions({
  name: "MultiUnitManagement"
});

const unitOptions = ref<UnitOption[]>([]);
const searchFormRef = ref();

const form = ref({
  name: ""
});

const { loading, dataList, pagination, fetchData } = useCrud<
  MultiUnitItem,
  CommonResult<PaginatedResponseDto<MultiUnitItem>>,
  { page: number }
>({
  api: (params: { page: number }) =>
    getMultiUnitListApi(params.page, {
      name: form.value.name || undefined
    }),
  transform: res => ({
    list: res.data?.list ?? [],
    total: res.data?.count ?? 0
  }),
  immediate: false // 等待 unitOptions 加载完成后再加载数据
});

const columns: TableColumnList = [
  {
    label: "单位组名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "基本单位",
    prop: "baseUnitName",
    minWidth: 100
  },
  {
    label: "换算关系",
    prop: "conversions",
    minWidth: 250,
    cellRenderer: ({ row }) => {
      if (!row.conversions?.length) return h("span", "-");
      const texts = row.conversions.map(
        (c: { unitName: string; ratio: number }) =>
          `1${c.unitName}=${c.ratio}${row.baseUnitName}`
      );
      return h("span", texts.join("; "));
    }
  },
  {
    label: "排序",
    prop: "sort",
    minWidth: 80
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 150
  }
];

const loadUnitOptions = async () => {
  try {
    const { data, code } = await getAllSingleUnitsApi();
    if (code === 200) {
      unitOptions.value = data || [];
    }
  } catch (e) {
    console.error(e);
  }
};

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  handleSearch();
};

const handleDelete = async (row: MultiUnitItem) => {
  try {
    const { code, msg } = await deleteMultiUnitApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      fetchData();
    } else {
      message(msg || "删除失败", { type: "error" });
    }
  } catch (e: unknown) {
    const err = e as Error;
    message(err.message || "删除失败", { type: "error" });
  }
};

function openDialog(title = "新增", row?: MultiUnitItem) {
  addDialog({
    title: `${title}多计量单位`,
    props: {
      formInline: {
        name: row?.name ?? "",
        baseUnitUid: row?.baseUnitUid ?? "",
        conversions:
          row?.conversions?.map(c => ({
            unitUid: c.unitUid,
            ratio: c.ratio
          })) ?? [],
        sort: row?.sort ?? 0,
        remark: row?.remark ?? ""
      },
      unitOptions: unitOptions.value,
      isEdit: title === "修改"
    },
    width: "600px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: () => h(Form, { ref: "formRef" }),
    beforeSure: async (done, { options }) => {
      const formRef = (options as unknown).contentRef?.getRef?.();
      if (!formRef) return;
      await formRef.validate(async (valid: boolean) => {
        if (!valid) return;
        const formData = (options.props as unknown).formInline;
        try {
          const promise =
            title === "新增"
              ? createMultiUnitApi({
                  name: formData.name,
                  baseUnitUid: formData.baseUnitUid,
                  conversions: formData.conversions.filter(
                    (c: { unitUid: string }) => c.unitUid
                  ),
                  sort: formData.sort,
                  remark: formData.remark
                })
              : updateMultiUnitApi(row!.uid, {
                  name: formData.name,
                  baseUnitUid: formData.baseUnitUid,
                  conversions: formData.conversions.filter(
                    (c: { unitUid: string }) => c.unitUid
                  ),
                  sort: formData.sort,
                  remark: formData.remark
                });
          const { code, msg } = await promise;
          if (code === 200) {
            message("操作成功", { type: "success" });
            done();
            fetchData();
          } else {
            message(msg || "操作失败", { type: "error" });
          }
        } catch (e: unknown) {
          const err = e as Error;
          message(err.message || "操作失败", { type: "error" });
        }
      });
    }
  });
}

onMounted(async () => {
  await loadUnitOptions();
  fetchData();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="handleSearch"
      @reset="resetForm"
    >
      <el-form-item label="单位组名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入单位组名称"
          clearable
          class="w-[200px]!"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="多计量单位" @refresh="fetchData">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          row-key="uid"
          :loading="loading"
          :size="size"
          :columns="dynamicColumns"
          :data="dataList"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="fetchData"
          @page-current-change="fetchData"
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
            <DeleteButton :show-icon="false" @confirm="handleDelete(row)" />
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

.search-form {
  @extend .search-form;
}
</style>

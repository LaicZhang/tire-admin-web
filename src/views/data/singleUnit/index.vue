<script setup lang="ts">
import { ref, h } from "vue";
import type { SingleUnitFormData, SingleUnitItem } from "./types";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import DeleteButton from "@/components/DeleteButton/index.vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getSingleUnitListApi,
  createSingleUnitApi,
  updateSingleUnitApi,
  deleteSingleUnitApi
} from "@/api/data/category";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useCrud } from "@/composables";
import Form from "./form.vue";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "SingleUnitManagement"
});

const searchFormRef = ref();
const dialogFormRef = ref<{ getRef: () => FormInstance } | null>(null);

const form = ref({
  name: ""
});

const { loading, dataList, pagination, fetchData } = useCrud<
  SingleUnitItem,
  CommonResult<PaginatedResponseDto<SingleUnitItem>>,
  { page?: number; pageSize?: number }
>({
  api: ({ page = 1 }) =>
    getSingleUnitListApi(page, {
      name: form.value.name || undefined
    }),
  transform: res => ({
    list: res.data?.list ?? [],
    total: res.data?.count ?? 0
  }),
  immediate: true
});

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  handleSearch();
};

const handleDelete = async (row: SingleUnitItem) => {
  try {
    const { code, msg } = await deleteSingleUnitApi(row.uid);
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

function openDialog(title = "新增", row?: SingleUnitItem) {
  addDialog({
    title: `${title}单计量单位`,
    props: {
      formInline: {
        name: row?.name ?? "",
        symbol: row?.symbol ?? "",
        isDefault: row?.isDefault ?? false,
        sort: row?.sort ?? 0,
        remark: row?.remark ?? ""
      },
      isEdit: title === "修改"
    },
    width: "500px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(Form, {
        ref: dialogFormRef,
        formInline: (options.props as { formInline: SingleUnitFormData })
          .formInline,
        isEdit: (options.props as { isEdit?: boolean }).isEdit
      }),
    beforeSure: async (done, { options }) => {
      const elForm = dialogFormRef.value?.getRef();
      if (!elForm) return;
      const valid = await elForm.validate();
      if (!valid) return;
      const formData = (options.props as { formInline: SingleUnitFormData })
        .formInline;
      const promise =
        title === "新增"
          ? createSingleUnitApi({
              name: formData.name,
              symbol: formData.symbol,
              isDefault: formData.isDefault,
              sort: formData.sort,
              remark: formData.remark
            })
          : row?.uid
            ? updateSingleUnitApi(row.uid, {
                name: formData.name,
                symbol: formData.symbol,
                isDefault: formData.isDefault,
                sort: formData.sort,
                remark: formData.remark
              })
            : null;
      if (!promise) {
        message("缺少数据ID，无法更新", { type: "error" });
        return;
      }
      try {
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
    }
  });
}
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
      <el-form-item label="单位名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入单位名称"
          clearable
          class="w-[200px]"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="单计量单位" @refresh="fetchData">
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

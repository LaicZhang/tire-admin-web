<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, reactive, onMounted, h, watch } from "vue";
import type { CategoryFormData, FlatCategoryItem } from "./types";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getIncomeCategoryListApi,
  createIncomeCategoryApi,
  updateIncomeCategoryApi,
  deleteIncomeCategoryApi,
  batchDeleteIncomeCategoryApi
} from "@/api/data/category";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { useCrud } from "@/composables";
import Form from "./form.vue";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "IncomeCategoryManagement"
});

const searchFormRef = ref();
const selectedRows = ref<FlatCategoryItem[]>([]);
const dialogFormRef = ref<{ getRef: () => FormInstance } | null>(null);

type CategoryListParams = {
  name?: string;
  code?: string;
  page?: number;
  pageSize?: number;
};

const form = reactive<CategoryListParams>({
  name: "",
  code: ""
});

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  FlatCategoryItem,
  Awaited<ReturnType<typeof getIncomeCategoryListApi>>,
  CategoryListParams
>({
  api: async ({ page = 1, pageSize = 10, ...params }) =>
    getIncomeCategoryListApi(page, { ...params, pageSize }),
  pagination: {
    pageSize: PAGE_SIZE_SMALL,
    background: true,
    layout: "total, sizes, prev, pager, next, jumper"
  },
  params: form,
  transform: res => ({
    list: res.data?.list ?? [],
    total: res.data?.count ?? res.data?.total ?? 0
  }),
  immediate: false
});

const resetForm = () => {
  searchFormRef.value?.resetFields();
  pagination.value.currentPage = 1;
  fetchData();
};

const handleDelete = async (row: FlatCategoryItem) => {
  try {
    const { code, msg } = await deleteIncomeCategoryApi(row.uid);
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

const handleBatchDelete = async () => {
  if (!selectedRows.value.length) {
    message("请选择要删除的数据", { type: "warning" });
    return;
  }
  try {
    const uids = selectedRows.value.map(row => row.uid);
    const { code, msg } = await batchDeleteIncomeCategoryApi(uids);
    if (code === 200) {
      message("批量删除成功", { type: "success" });
      selectedRows.value = [];
      fetchData();
    } else {
      message(msg || "批量删除失败", { type: "error" });
    }
  } catch (e: unknown) {
    const err = e as Error;
    message(err.message || "批量删除失败", { type: "error" });
  }
};

const handleSelectionChange = (rows: FlatCategoryItem[]) => {
  selectedRows.value = rows;
};

// 监听搜索表单变化，自动重新获取数据
watch(
  () => [form.name, form.code],
  () => {
    pagination.value.currentPage = 1;
    fetchData();
  },
  { deep: true }
);

function openDialog(title = "新增", row?: FlatCategoryItem) {
  addDialog({
    title: `${title}收入类别`,
    props: {
      formInline: {
        code: row?.code ?? "",
        name: row?.name ?? "",
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
        formInline: (options.props as { formInline: CategoryFormData })
          .formInline,
        isEdit: (options.props as { isEdit?: boolean }).isEdit
      }),
    beforeSure: async (done, { options }) => {
      const elForm = dialogFormRef.value?.getRef();
      if (!elForm) return;
      const valid = await elForm.validate();
      if (!valid) return;
      const formData = (options.props as { formInline: CategoryFormData })
        .formInline;
      const promise =
        title === "新增"
          ? createIncomeCategoryApi({
              code: formData.code,
              name: formData.name,
              sort: formData.sort,
              remark: formData.remark
            })
          : row?.uid
            ? updateIncomeCategoryApi(row.uid, {
                name: formData.name,
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

// 初始加载数据
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="main">
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="编码" prop="code">
        <el-input
          v-model="form.code"
          placeholder="请输入编码"
          clearable
          class="w-[160px]"
        />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入名称"
          clearable
          class="w-[160px]"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          @click="fetchData"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="收入类别" @refresh="fetchData">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增
        </el-button>
        <el-popconfirm
          title="确认批量删除选中数据?"
          @confirm="handleBatchDelete"
        >
          <template #reference>
            <el-button
              type="danger"
              :icon="useRenderIcon(Delete)"
              :disabled="!selectedRows.length"
            >
              批量删除
            </el-button>
          </template>
        </el-popconfirm>
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
          @selection-change="handleSelectionChange"
          @page-size-change="onSizeChange(pagination.pageSize)"
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

<script setup lang="ts">
import { h, ref, reactive } from "vue";
import { columns } from "./columns";
import {
  getDefectCategoryListApi,
  deleteDefectCategoryApi,
  type DefectCategory
} from "@/api/business/quality";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Add from "~icons/ep/plus";
import Edit from "~icons/ep/edit";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { message } from "@/utils/message";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import DefectCategoryForm from "./DefectCategoryForm.vue";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";

defineOptions({
  name: "QualityDefect"
});

const form = reactive({
  name: ""
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const { loading, dataList, fetchData } = useCrud<
  DefectCategory,
  CommonResult<DefectCategory[]>,
  { page: number; pageSize: number }
>({
  api: () =>
    getDefectCategoryListApi({ name: form.name }) as Promise<
      CommonResult<DefectCategory[]>
    >,
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "加载失败", { type: "error" });
      return { list: [], total: 0 };
    }
    // API returns array directly, not { list, total }
    const list = Array.isArray(res.data) ? res.data : [];
    return { list, total: list.length };
  },
  immediate: true
});

const onSearch = () => {
  fetchData();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  onSearch();
};

function handleAdd() {
  addDialog({
    title: "新增分类",
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(DefectCategoryForm, {
        initialData: { id: 0, name: "", description: "", solution: "" },
        mode: "add",
        onSuccess: () => {
          closeAllDialog();
          fetchData();
        },
        onClose: () => closeAllDialog()
      })
  });
}

function handleEdit(row: DefectCategory) {
  addDialog({
    title: "编辑分类",
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(DefectCategoryForm, {
        initialData: {
          id: row.id,
          name: row.name,
          description: row.description || "",
          solution: row.solution || ""
        },
        mode: "edit",
        onSuccess: () => {
          closeAllDialog();
          fetchData();
        },
        onClose: () => closeAllDialog()
      })
  });
}

async function handleDelete(row: DefectCategory) {
  try {
    await deleteDefectCategoryApi(row.id);
    message("删除成功", { type: "success" });
    fetchData();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "删除失败";
    message(msg, { type: "error" });
  }
}
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入名称" clearable />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="缺陷分类" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(Add)" @click="handleAdd">
          新增分类
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        >
          <template #operation="{ row }">
            <el-button
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(Edit)"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <DeleteButton
              :show-icon="false"
              size="small"
              @confirm="handleDelete(row)"
            />
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

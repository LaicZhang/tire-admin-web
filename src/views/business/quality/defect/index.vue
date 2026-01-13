<script setup lang="ts">
import { h, ref, reactive, onMounted } from "vue";
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

defineOptions({
  name: "QualityDefect"
});

const loading = ref(true);
const dataList = ref<DefectCategory[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  name: ""
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const columns: TableColumnList = [
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "描述",
    prop: "description"
  },
  {
    label: "解决方案",
    prop: "solution"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getDefectCategoryListApi({
      name: form.name
    });
    dataList.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

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
          onSearch();
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
          onSearch();
        },
        onClose: () => closeAllDialog()
      })
  });
}

async function handleDelete(row: DefectCategory) {
  try {
    await deleteDefectCategoryApi(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => {
  onSearch();
});
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

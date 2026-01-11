<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  getDefectCategoryListApi,
  createDefectCategoryApi,
  updateDefectCategoryApi,
  deleteDefectCategoryApi,
  type DefectCategory
} from "@/api/business/quality";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Add from "~icons/ep/plus";
import Edit from "~icons/ep/edit";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { message } from "@/utils/message";

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

const dialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const dialogForm = reactive({
  id: 0,
  name: "",
  description: "",
  solution: ""
});
const dialogLoading = ref(false);
const formRef = ref();
const dialogFormRef = ref();

const rules = {
  name: [{ required: true, message: "请输入分类名称", trigger: "blur" }]
};

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

const resetForm = (formEl: { resetFields: () => void } | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
  onSearch();
};

function handleAdd() {
  dialogType.value = "add";
  dialogVisible.value = true;
  // Reset dialog form
  Object.assign(dialogForm, { id: 0, name: "", description: "", solution: "" });
}

function handleEdit(row: DefectCategory) {
  dialogType.value = "edit";
  dialogVisible.value = true;
  Object.assign(dialogForm, { ...row, id: row.id });
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

async function onDialogSubmit(
  formEl: { validate: (cb: (valid: boolean) => void) => void } | undefined
) {
  if (!formEl) return;
  await formEl.validate(async (valid: boolean) => {
    if (valid) {
      dialogLoading.value = true;
      try {
        if (dialogType.value === "add") {
          await createDefectCategoryApi(dialogForm);
        } else {
          await updateDefectCategoryApi(dialogForm.id, dialogForm);
        }
        message("操作成功", { type: "success" });
        dialogVisible.value = false;
        onSearch();
      } catch (e) {
        console.error(e);
      } finally {
        dialogLoading.value = false;
      }
    }
  });
}

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入名称" clearable />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

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

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增分类' : '编辑分类'"
      width="500px"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="dialogForm.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="dialogForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="解决方案" prop="solution">
          <el-input v-model="dialogForm.solution" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="dialogLoading"
            @click="onDialogSubmit(dialogFormRef)"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

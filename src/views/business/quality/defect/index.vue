<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  getDefectCategoryListApi,
  createDefectCategoryApi,
  updateDefectCategoryApi,
  deleteDefectCategoryApi
} from "@/api/business/quality";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Add from "~icons/ep/plus";
import Delete from "~icons/ep/delete";
import Edit from "~icons/ep/edit";
import { message } from "@/utils/message";

defineOptions({
  name: "QualityDefect"
});

const loading = ref(true);
const dataList = ref([]);
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
    // Assuming API returns array directly or inside list, adjusting based on common logic
    dataList.value = Array.isArray(data) ? data : data.list || [];
    // pagination might not be applicable if it returns all, but let's assume valid structure
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const resetForm = formEl => {
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

function handleEdit(row) {
  dialogType.value = "edit";
  dialogVisible.value = true;
  Object.assign(dialogForm, { ...row, id: row.id });
}

async function handleDelete(row) {
  try {
    await deleteDefectCategoryApi(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    console.error(e);
  }
}

async function onDialogSubmit(formEl) {
  if (!formEl) return;
  await formEl.validate(async valid => {
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
            <el-popconfirm title="是否确认删除?" @confirm="handleDelete(row)">
              <template #reference>
                <el-button
                  link
                  type="danger"
                  :size="size"
                  :icon="useRenderIcon(Delete)"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
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

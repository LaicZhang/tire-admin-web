<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import type { FlatCategoryItem } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
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
import Form from "./form.vue";

defineOptions({
  name: "IncomeCategoryManagement"
});

const dataList = ref<FlatCategoryItem[]>([]);
const loading = ref(false);
const searchFormRef = ref();
const selectedRows = ref<FlatCategoryItem[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

const form = reactive({
  name: "",
  code: ""
});

const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "编码",
    prop: "code",
    minWidth: 120
  },
  {
    label: "名称",
    prop: "name",
    minWidth: 150
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

const getData = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getIncomeCategoryListApi(
      pagination.currentPage,
      { ...form }
    );
    if (code === 200) {
      dataList.value = data.list || [];
      pagination.total = data.count || data.total || 0;
    } else {
      message(msg, { type: "error" });
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  pagination.currentPage = 1;
  getData();
};

const handleDelete = async (row: FlatCategoryItem) => {
  try {
    const { code, msg } = await deleteIncomeCategoryApi(row.uid);
    if (code === 200) {
      message("删除成功", { type: "success" });
      getData();
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
      getData();
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
    contentRenderer: () => h(Form, { ref: "formRef" }),
    beforeSure: async (done, { options }) => {
      const formRef = (options as any).contentRef?.getRef?.();
      if (!formRef) return;
      await formRef.validate(async (valid: boolean) => {
        if (!valid) return;
        const formData = (options.props as any).formInline;
        try {
          const promise =
            title === "新增"
              ? createIncomeCategoryApi({
                  code: formData.code,
                  name: formData.name,
                  sort: formData.sort,
                  remark: formData.remark
                })
              : updateIncomeCategoryApi(row!.uid, {
                  name: formData.name,
                  sort: formData.sort,
                  remark: formData.remark
                });
          const { code, msg } = await promise;
          if (code === 200) {
            message("操作成功", { type: "success" });
            done();
            getData();
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

onMounted(() => {
  getData();
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
          class="!w-[160px]"
          @keyup.enter="getData"
        />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入名称"
          clearable
          class="!w-[160px]"
          @keyup.enter="getData"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="getData"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="收入类别" @refresh="getData">
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
          @page-size-change="getData"
          @page-current-change="getData"
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
            <el-popconfirm title="确认删除?" @confirm="handleDelete(row)">
              <template #reference>
                <el-button
                  class="reset-margin"
                  link
                  type="danger"
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
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 20px;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>

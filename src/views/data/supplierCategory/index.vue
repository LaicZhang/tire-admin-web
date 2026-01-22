<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import type { TreeCategoryItem } from "./types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Plus from "~icons/ep/plus";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getSupplierCategoryTreeApi,
  createSupplierCategoryApi,
  updateSupplierCategoryApi,
  deleteSupplierCategoryApi
} from "@/api/data/category";
import { message } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import Form from "./form.vue";

defineOptions({
  name: "SupplierCategoryManagement"
});

const treeData = ref<TreeCategoryItem[]>([]);
const dataList = ref<TreeCategoryItem[]>([]);
const loading = ref(false);
const expandRowKeys = ref<string[]>([]);

const form = ref({
  name: ""
});

const searchColumns: PlusColumn[] = [
  {
    label: "类别名称",
    prop: "name",
    valueType: "copy",
    fieldProps: {
      placeholder: "请输入类别名称"
    }
  }
];

const columns: TableColumnList = [
  {
    label: "类别名称",
    prop: "name",
    minWidth: 200,
    align: "left"
  },
  {
    label: "层级",
    prop: "level",
    minWidth: 80,
    cellRenderer: ({ row }) => h("span", `第${row.level || 1}级`)
  },
  {
    label: "排序",
    prop: "sort",
    minWidth: 80
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 200
  }
];

const filterTreeData = (
  data: TreeCategoryItem[],
  keyword: string
): TreeCategoryItem[] => {
  if (!keyword) return data;
  const result: TreeCategoryItem[] = [];
  for (const item of data) {
    if (item.name.includes(keyword)) {
      result.push(item);
    } else if (item.children?.length) {
      const filtered = filterTreeData(item.children, keyword);
      if (filtered.length) {
        result.push({ ...item, children: filtered });
      }
    }
  }
  return result;
};

const getData = async () => {
  loading.value = true;
  try {
    const { data, code, msg } = await getSupplierCategoryTreeApi();
    if (code === 200) {
      treeData.value = data || [];
      dataList.value = filterTreeData(data || [], form.value.name);
      if (form.value.name && dataList.value.length) {
        const getAllUids = (items: TreeCategoryItem[]): string[] => {
          const uids: string[] = [];
          for (const item of items) {
            uids.push(item.uid);
            if (item.children) {
              uids.push(...getAllUids(item.children));
            }
          }
          return uids;
        };
        expandRowKeys.value = getAllUids(dataList.value);
      }
    } else {
      message(msg, { type: "error" });
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  getData();
};

const handleReset = () => {
  form.value.name = "";
  getData();
};

const handleDelete = async (row: TreeCategoryItem) => {
  if (row.children?.length) {
    message("该类别下有子类别，无法删除", { type: "warning" });
    return;
  }
  try {
    const { code, msg } = await deleteSupplierCategoryApi(row.uid);
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

function openDialog(
  title = "新增",
  row?: TreeCategoryItem,
  isAddChild = false
) {
  const parentUid = isAddChild ? row?.uid : row?.parentUid || null;
  addDialog({
    title: `${title}供应商类别`,
    props: {
      formInline: {
        name: isAddChild ? "" : (row?.name ?? ""),
        parentUid: parentUid ?? null,
        sort: isAddChild ? 0 : (row?.sort ?? 0)
      },
      treeData: treeData.value,
      isEdit: title === "修改"
    },
    width: "500px",
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
            title === "新增" || isAddChild
              ? createSupplierCategoryApi({
                  name: formData.name,
                  parentUid: formData.parentUid || null,
                  sort: formData.sort
                })
              : updateSupplierCategoryApi(row!.uid, {
                  name: formData.name,
                  parentUid: formData.parentUid || null,
                  sort: formData.sort
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
    <PlusSearch
      v-model="form"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="searchColumns"
      :show-number="3"
      label-width="80"
      label-position="right"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="bg-white p-4 rounded-md">
      <PureTableBar title="供应商类别" @refresh="getData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增类别
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            border
            adaptive
            row-key="uid"
            :loading="loading"
            :size="size"
            :columns="dynamicColumns"
            :data="dataList"
            :expand-row-keys="expandRowKeys"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
            default-expand-all
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(Plus)"
                @click="openDialog('新增', row, true)"
              >
                添加子类
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <DeleteButton
                title="确认删除该类别?"
                :show-icon="false"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
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

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import type { CategoryFormData, TreeCategoryItem } from "./types";
import { columns } from "./columns";
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
import { message, handleApiError } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import Form from "./form.vue";
import type { FormInstance } from "element-plus";

defineOptions({
  name: "SupplierCategoryManagement"
});

const treeData = ref<TreeCategoryItem[]>([]);
const dataList = ref<TreeCategoryItem[]>([]);
const loading = ref(false);
const expandRowKeys = ref<string[]>([]);
const dialogFormRef = ref<{ getRef: () => FormInstance } | null>(null);

const form = ref({
  name: ""
});

const searchColumns: PlusColumn[] = [
  {
    label: "类别名称",
    prop: "name",
    valueType: "copy"
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
    handleApiError(e, "获取供应商类别失败");
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
    contentRenderer: ({ options }) =>
      h(Form, {
        ref: dialogFormRef,
        formInline: (options.props as { formInline: CategoryFormData })
          .formInline,
        treeData: (options.props as { treeData: TreeCategoryItem[] }).treeData,
        isEdit: (options.props as { isEdit?: boolean }).isEdit
      }),
    beforeSure: async (done, { options }) => {
      const elForm = dialogFormRef.value?.getRef();
      if (!elForm) return;
      const valid = await elForm.validate();
      if (!valid) return;
      const formData = (options.props as { formInline: CategoryFormData })
        .formInline;
      const isCreate = title === "新增" || isAddChild;
      const promise = isCreate
        ? createSupplierCategoryApi({
            name: formData.name,
            parentUid: formData.parentUid || null,
            sort: formData.sort
          })
        : row?.uid
          ? updateSupplierCategoryApi(row.uid, {
              name: formData.name,
              parentUid: formData.parentUid || null,
              sort: formData.sort
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
          getData();
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
            :tree-props="{
              children: 'children',
              hasChildren: 'hasChildren',
              checkStrictly: true
            }"
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

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import type { TreeCategoryItem } from "./types";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Plus from "~icons/ep/plus";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  getCustomerCategoryTreeApi,
  createCustomerCategoryApi,
  updateCustomerCategoryApi,
  deleteCustomerCategoryApi
} from "@/api/data/category";
import { message, handleApiError } from "@/utils";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import Form from "./form.vue";

defineOptions({
  name: "CustomerCategoryManagement"
});

const treeData = ref<TreeCategoryItem[]>([]);
const dataList = ref<TreeCategoryItem[]>([]);
const loading = ref(false);
const searchFormRef = ref();
const expandRowKeys = ref<string[]>([]);

const form = reactive({
  name: ""
});

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
    const { data, code, msg } = await getCustomerCategoryTreeApi();
    if (code === 200) {
      treeData.value = data || [];
      dataList.value = filterTreeData(data || [], form.name);
      if (form.name && dataList.value.length) {
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
    handleApiError(e, "获取客户类别失败");
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  searchFormRef.value?.resetFields();
  getData();
};

const handleDelete = async (row: TreeCategoryItem) => {
  if (row.children?.length) {
    message("该类别下有子类别，无法删除", { type: "warning" });
    return;
  }
  try {
    const { code, msg } = await deleteCustomerCategoryApi(row.uid);
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
    title: `${title}客户类别`,
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
              ? createCustomerCategoryApi({
                  name: formData.name,
                  parentUid: formData.parentUid || null,
                  sort: formData.sort
                })
              : updateCustomerCategoryApi(row!.uid, {
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
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="类别名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入类别名称"
          clearable
          class="w-[200px]!"
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

    <PureTableBar title="客户类别" @refresh="getData">
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
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

.search-form {
  @extend .search-form;
}
</style>

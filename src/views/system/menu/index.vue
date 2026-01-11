<script setup lang="ts">
import { ref, onMounted, reactive, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import { useColumns } from "./columns";
import { FormItemProps } from "./utils/types";
import MenuForm from "./form.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils";
import {
  getMenuListApi,
  createMenuApi,
  updateMenuApi,
  deleteMenuApi
} from "@/api/system/menu";

// Icons
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import More from "~icons/ep/more-filled";
import DeleteButton from "@/components/DeleteButton/index.vue";

defineOptions({
  name: "MenuManagement"
});

const searchFormRef = ref();
const formRef = ref();
const {
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  adaptiveConfig,
  onSizeChange,
  onCurrentChange
} = useColumns();

const form = reactive({
  title: "",
  status: ""
});

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getMenuListApi(); // API currently doesn't support filtering in mock maybe, but we can pass params
    // Assuming data is list, we might need to process it to tree if backend doesn't return tree
    // But usually backend returns tree for menu
    dataList.value = data;
    pagination.total = dataList.value.length;
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

const openDialog = (title = "新增", row?: FormItemProps) => {
  addDialog({
    title: `${title}菜单`,
    props: {
      formInline: {
        code: row?.code ?? 0,
        parentId: row?.parentId ?? "",
        title: row?.title ?? "",
        icon: row?.icon ?? "",
        path: row?.path ?? "",
        rank: row?.rank ?? 99,
        component: row?.component ?? "",
        auths: row?.auths ?? "",
        frameSrc: row?.frameSrc ?? "",
        redirect: row?.redirect ?? "",
        showLink: row?.showLink ?? true,
        keepAlive: row?.keepAlive ?? false,
        hidden: row?.hidden ?? false,
        fixedTag: row?.fixedTag ?? false,
        hiddenTag: row?.hiddenTag ?? false,
        enterTransition: row?.enterTransition ?? "",
        leaveTransition: row?.leaveTransition ?? ""
      }
    },
    width: "45%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(MenuForm, {
        ref: formRef,
        formInline: (options.props! as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = options.props!.formInline as FormItemProps;
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (valid) {
          // console.log("curData", curData);
          const promise =
            title === "新增"
              ? createMenuApi(curData)
              : updateMenuApi(
                  String((row as unknown)?.uid ?? (row as unknown)?.id ?? ""),
                  curData
                );

          promise.then(() => {
            message("操作成功", { type: "success" });
            done();
            onSearch();
          });
        }
      });
    }
  });
};

const handleDelete = async (row: unknown) => {
  await deleteMenuApi(String(row.uid ?? row.id));
  message("删除成功", { type: "success" });
  onSearch();
};

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="m-5">
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-3"
    >
      <el-form-item label="菜单名称" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入菜单名称"
          clearable
          class="w-48!"
        />
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
        <el-button
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(searchFormRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="菜单管理" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增菜单
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="path"
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
        >
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('修改', row)"
            >
              修改
            </el-button>
            <DeleteButton
              :size="size"
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
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>

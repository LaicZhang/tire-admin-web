<script setup lang="ts">
import { ref, onMounted, h, reactive } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import { useColumns } from "./columns";
import { FormItemProps } from "./utils/types";
import PermissionForm from "./form.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import {
  getPermissionListApi,
  createPermissionApi,
  updatePermissionApi,
  deletePermissionApi,
  type PermissionItem
} from "@/api/system/permission";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import "plus-pro-components/es/components/search/style/css";

// Icons
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import DeleteButton from "@/components/DeleteButton/index.vue";

defineOptions({
  name: "PermissionManagement"
});

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

const state = ref({
  name: "",
  code: ""
});

const searchColumns: PlusColumn[] = [
  {
    label: "权限名称",
    prop: "name",
    valueType: "copy"
  },
  {
    label: "权限标识",
    prop: "code",
    valueType: "copy"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getPermissionListApi({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...state.value
    });
    dataList.value = data.list || [];
    pagination.total = data.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const handleReset = () => {
  state.value = { name: "", code: "" };
  onSearch();
};

const openDialog = (title = "新增", row?: FormItemProps & { id?: string }) => {
  addDialog({
    title: `${title}权限`,
    props: {
      formInline: {
        name: row?.name ?? "",
        code: row?.code ?? "",
        description: row?.description ?? ""
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(PermissionForm, {
        ref: formRef,
        formInline: (options.props! as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = (options.props as { formInline: FormItemProps })
        .formInline;
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (!valid) return;

        const promise =
          title === "新增"
            ? createPermissionApi(curData)
            : row?.id
              ? updatePermissionApi(row.id, curData)
              : null;

        if (!promise) {
          message("缺少权限ID", { type: "error" });
          return;
        }

        promise.then(() => {
          message("操作成功", { type: "success" });
          done();
          onSearch();
        });
      });
    }
  });
};

const handleDelete = async (row: PermissionItem) => {
  if (!row.id) return;
  await deletePermissionApi(row.id);
  message("删除成功", { type: "success" });
  onSearch();
};

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <PlusSearch
      v-model="state"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="searchColumns"
      :show-number="2"
      label-width="80"
      label-position="right"
      @search="onSearch"
      @reset="handleReset"
    />

    <div class="bg-white p-4 rounded-md">
      <PureTableBar title="权限管理" @refresh="onSearch">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增权限
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            row-key="id"
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
  </div>
</template>

<style scoped lang="scss">
.page-container {
  @extend .page-container;
}

:deep(.el-card) {
  border: none;
  box-shadow: none;
}
</style>

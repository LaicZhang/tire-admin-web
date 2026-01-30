<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import { useColumns } from "./columns";
import { FormItemProps } from "./utils/types";
import PermissionForm from "./form.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message, handleApiError } from "@/utils";
import {
  getPermissionsApi,
  createPermissionApi,
  updatePermissionApi,
  deletePermissionApi,
  restorePermissionApi,
  type PermissionDto
} from "@/api/system/permission";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import "plus-pro-components/es/components/search/style/css";

// Icons
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import DeleteButton from "@/components/DeleteButton/index.vue";

defineOptions({
  name: "PermissionManagement"
});

const formRef = ref();
const { loading, columns, dataList, pagination, onSizeChange } = useColumns();

const state = ref({
  scope: "nonDeleted" as "nonDeleted" | "deleted" | "all",
  keyword: "",
  module: "",
  path: "",
  type: "",
  belong: ""
});

const searchColumns: PlusColumn[] = [
  {
    label: "范围",
    prop: "scope",
    valueType: "select",
    options: [
      { label: "未删除", value: "nonDeleted" },
      { label: "已删除", value: "deleted" },
      { label: "全部", value: "all" }
    ]
  },
  {
    label: "关键词",
    prop: "keyword",
    valueType: "copy"
  },
  {
    label: "模块",
    prop: "module",
    valueType: "copy"
  },
  {
    label: "Path",
    prop: "path",
    valueType: "copy"
  },
  {
    label: "方法",
    prop: "type",
    valueType: "copy"
  },
  {
    label: "归属",
    prop: "belong",
    valueType: "select",
    options: [
      { label: "个人(1)", value: "1" },
      { label: "部门(2)", value: "2" }
    ]
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const { data } = await getPermissionsApi(pagination.currentPage, {
      scope: state.value.scope,
      keyword: state.value.keyword || undefined,
      module: state.value.module || undefined,
      path: state.value.path || undefined,
      type: state.value.type || undefined,
      belong: state.value.belong === "" ? undefined : Number(state.value.belong)
    });
    dataList.value = data?.list ?? [];
    pagination.total = data?.count ?? 0;
  } catch (e) {
    handleApiError(e, "获取权限列表失败");
  } finally {
    loading.value = false;
  }
}

const handleReset = () => {
  state.value = {
    scope: "nonDeleted",
    keyword: "",
    module: "",
    path: "",
    type: "",
    belong: ""
  };
  onSearch();
};

const openDialog = (title = "新增", row?: PermissionDto) => {
  addDialog({
    title: `${title}权限`,
    props: {
      formInline: {
        type: row?.type ?? "get",
        module: row?.module ?? "",
        path: row?.path ?? "",
        desc: row?.desc ?? "",
        belong: row?.belong ?? 1
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

        const payload = {
          type: curData.type || undefined,
          module: curData.module || undefined,
          path: curData.path,
          desc: curData.desc || undefined,
          belong: curData.belong
        };

        const promise =
          title === "新增"
            ? createPermissionApi(payload)
            : row?.uid
              ? updatePermissionApi(row.uid, payload)
              : null;

        if (!promise) return message("缺少权限UID", { type: "error" });

        promise.then(() => {
          message("操作成功", { type: "success" });
          done();
          onSearch();
        });
      });
    }
  });
};

const handleDelete = async (row: PermissionDto) => {
  if (!row.uid) return;
  await deletePermissionApi(row.uid);
  message("删除成功（可恢复）", { type: "success" });
  onSearch();
};

const handleRestore = async (row: PermissionDto) => {
  if (!row.uid) return;
  await restorePermissionApi(row.uid);
  message("恢复成功", { type: "success" });
  onSearch();
};

function handleSizeChange(val: number) {
  onSizeChange(val);
  pagination.currentPage = 1;
  onSearch();
}

function handleCurrentChange(val: number) {
  pagination.currentPage = val;
  onSearch();
}

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
            row-key="uid"
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
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <template v-if="row.deleteAt">
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  @click="handleRestore(row)"
                >
                  恢复
                </el-button>
              </template>
              <template v-else>
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

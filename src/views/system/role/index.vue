<script setup lang="ts">
import { onMounted, ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Eye from "~icons/ep/view";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { useColumns } from "./columns";
import {
  getRolesApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleApi
} from "@/api/system/role";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import RoleForm from "./form.vue";
import { message, handleApiError } from "@/utils";
import { FormItemProps } from "./utils/types";

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

defineOptions({
  name: "role"
});

const formRef = ref();
const state = ref({
  name: "",
  status: ""
});

const formColumns: PlusColumn[] = [
  {
    label: "角色名称",
    prop: "name",
    valueType: "copy"
  },
  {
    label: "状态",
    prop: "status",
    valueType: "select",
    options: [
      {
        label: "启用",
        value: "1",
        color: "blue"
      },
      {
        label: "禁用",
        value: "0",
        color: "red"
      }
    ]
  }
];

const handleSearch = async () => {
  loading.value = true;
  try {
    const { code, data } = await getRolesApi(
      pagination.currentPage,
      state.value
    );
    if (code === 200) {
      dataList.value = data.list;
      pagination.total = data.count;
    }
  } catch (error) {
    handleApiError(error, "获取角色列表失败");
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  state.value = { name: "", status: "" };
  handleSearch();
};

const openDialog = (title = "新增", row?: FormItemProps) => {
  addDialog({
    title: `${title}角色`,
    props: {
      formInline: {
        id: row?.id,
        name: row?.name ?? "",
        code: row?.code ?? "",
        description: row?.description ?? "",
        status: row?.status ?? 1
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(RoleForm, {
        ref: formRef,
        formInline: (options.props! as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = (options.props as { formInline: FormItemProps })
        .formInline;
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (valid) {
          const promise =
            title === "新增"
              ? createRoleApi(curData)
              : updateRoleApi(row?.id ?? "", curData);

          promise.then(() => {
            message("操作成功", { type: "success" });
            done();
            handleSearch();
          });
        }
      });
    }
  });
};

const deleteOne = async (row: FormItemProps) => {
  await deleteRoleApi(row.id ?? "");
  message("删除成功", { type: "success" });
  handleSearch();
};

onMounted(() => {
  handleSearch();
});
</script>

<template>
  <div class="m-[20px]">
    <PlusSearch
      v-model="state"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="formColumns"
      :show-number="2"
      label-width="80"
      label-position="right"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="bg-white p-4 rounded-md">
      <PureTableBar :title="$route.meta.title" @refresh="handleSearch">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增角色
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            ref="tableRef"
            border
            adaptive
            :adaptiveConfig="adaptiveConfig"
            row-key="id"
            alignWhole="center"
            showOverflowTooltip
            :loading="loading"
            :loading-config="loadingConfig"
            :data="dataList"
            :columns="columns"
            :pagination="pagination"
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
                @click.prevent="openDialog('修改', row)"
              >
                修改
              </el-button>
              <DeleteButton
                :size="size"
                :show-icon="false"
                @confirm="deleteOne(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
</template>

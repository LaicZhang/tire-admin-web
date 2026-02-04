<script setup lang="ts">
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Eye from "~icons/ep/view";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { columns } from "./columns";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import WarehouseForm from "./form.vue";
import { message } from "@/utils";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import type { FormItemProps } from "./types";
import {
  getStorageZoneListApi,
  createStorageZoneApi,
  getStorageZoneApi,
  updateStorageZoneApi,
  deleteStorageZoneApi
} from "@/api/business/storage";
import { useCrud } from "@/composables";

defineOptions({
  name: "DataWarehouse"
});

const formRef = ref();
const { confirm } = useConfirmDialog();

const state = ref({
  name: "",
  code: ""
});

const formColumns: PlusColumn[] = [
  {
    label: "仓库名称",
    prop: "name",
    valueType: "copy"
  },
  {
    label: "仓库编码",
    prop: "code",
    valueType: "copy"
  }
];

const { loading, dataList, pagination, fetchData, onCurrentChange } = useCrud<
  FormItemProps,
  Awaited<ReturnType<typeof getStorageZoneListApi>>
>({
  api: () =>
    getStorageZoneListApi({
      name: state.value.name || undefined,
      code: state.value.code || undefined
    }),
  deleteApi: id => deleteStorageZoneApi(String(id)),
  immediate: true
});

const handleReset = () => {
  state.value = { name: "", code: "" };
  fetchData();
};

const getDetails = async (row: FormItemProps) => {
  const uid = row.uid;
  if (!uid) {
    message("缺少仓库 UID", { type: "warning" });
    return;
  }
  loading.value = true;
  try {
    const { data, code } = await getStorageZoneApi(uid);
    if (code !== 200) return;
    const warehouse = data as FormItemProps;
    addDialog({
      title: "仓库详情",
      props: {
        formInline: { ...warehouse },
        disabled: true
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: true,
      hideFooter: true,
      contentRenderer: ({ options }) =>
        h(WarehouseForm, {
          ref: formRef,
          formInline: (options.props as { formInline: FormItemProps })
            .formInline,
          disabled: true
        })
    });
  } finally {
    loading.value = false;
  }
};

const openDialog = (title = "新增", row?: FormItemProps) => {
  addDialog({
    title: `${title}仓库`,
    props: {
      formInline: {
        uid: row?.uid,
        code: row?.code ?? "",
        name: row?.name ?? "",
        address: row?.address ?? "",
        manager: row?.manager ?? "",
        phone: row?.phone ?? "",
        desc: row?.desc ?? "",
        status: row?.status ?? 1
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(WarehouseForm, {
        ref: formRef,
        formInline: (options.props as { formInline: FormItemProps }).formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = (options.props as { formInline: FormItemProps })
        .formInline;
      const FormRef = formRef.value.getRef();
      FormRef.validate((valid: boolean) => {
        if (valid) {
          const uid = row?.uid ?? curData.uid ?? "";
          if (title !== "新增" && !uid) {
            message("缺少仓库 UID", { type: "warning" });
            return;
          }
          const promise =
            title === "新增"
              ? createStorageZoneApi(curData)
              : updateStorageZoneApi(uid, curData);
          promise.then(() => {
            message("操作成功", { type: "success" });
            done();
            fetchData();
          });
        }
      });
    }
  });
};

const deleteOne = async (row: { uid?: string; name: string }) => {
  if (!row.uid) {
    message("缺少仓库 UID", { type: "warning" });
    return;
  }
  const ok = await confirm(
    `确定要删除仓库 "${row.name}" 吗？此操作不可恢复。`,
    "删除确认",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    }
  );
  if (!ok) return;

  try {
    await deleteStorageZoneApi(row.uid);
    message("删除成功", { type: "success" });
    fetchData();
  } catch (error) {
    message("删除失败", { type: "error" });
  }
};
</script>

<template>
  <div class="page-container">
    <PlusSearch
      v-model="state"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="formColumns"
      :show-number="3"
      label-width="80"
      label-position="right"
      @search="fetchData"
      @reset="handleReset"
    />

    <div class="bg-white p-4 rounded-md">
      <PureTableBar :title="$route.meta.title" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增仓库
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            border
            adaptive
            row-key="id"
            alignWhole="center"
            showOverflowTooltip
            :loading="loading"
            :data="dataList"
            :columns="columns"
            :pagination="{ ...pagination, size }"
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(Eye)"
                @click.prevent="getDetails(row)"
              >
                查看
              </el-button>
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
              <el-button
                class="reset-margin"
                link
                type="danger"
                :size="size"
                :icon="useRenderIcon(Delete)"
                @click.prevent="deleteOne(row)"
              >
                删除
              </el-button>
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

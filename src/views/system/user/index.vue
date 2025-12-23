<script setup lang="ts">
import { onMounted, ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Eye from "~icons/ep/view";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";
// https://plus-pro-components.com/components/search.html
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { useColumns } from "./columns";
import {
  getOneUserApi,
  getUsersApi,
  addUserApi,
  updateUserApi,
  deleteUserApi
} from "@/api/user";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import UserForm from "./form.vue";
import { message } from "@/utils";
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
  name: "user"
});
const state = ref({
  status: "",
  username: ""
});
const formRef = ref();

const formColumns: PlusColumn[] = [
  {
    label: "用户名",
    prop: "username",
    valueType: "copy"
  },
  {
    label: "手机号",
    prop: "phone",
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

const handleChange = () => {
  handleSearch();
};
const handleSearch = async () => {
  loading.value = true;
  const { code, data } = await getUsersApi(pagination.currentPage, state.value);

  if (code === 200) {
    dataList.value = data.list;
    pagination.total = data.count;
  }
  loading.value = false;
};
const handleReset = () => {
  state.value = { status: "", username: "" };
  handleSearch();
};
const getDetails = async (row: { uid: string }) => {
  loading.value = true;
  const { data } = await getOneUserApi(row.uid);
  loading.value = false;
  // TODO: 显示详情弹窗
  console.log("User details:", data);
};

const openDialog = (title = "新增", row?: FormItemProps) => {
  addDialog({
    title: `${title}用户`,
    props: {
      formInline: {
        uid: row?.uid,
        username: row?.username ?? "",
        phone: row?.phone ?? "",
        email: row?.email ?? "",
        password: "", // 密码不回显
        status: row?.status ?? "1"
      }
    },
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(UserForm, {
        ref: formRef,
        formInline: options.props.formInline
      }),
    beforeSure: (done, { options }) => {
      const curData = options.props.formInline as FormItemProps;
      const FormRef = formRef.value.getRef();
      FormRef.validate(valid => {
        if (valid) {
          const promise =
            title === "新增"
              ? addUserApi(curData)
              : updateUserApi(row?.uid, curData);

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

const deleteOne = async row => {
  try {
    await deleteUserApi(row.uid);
    message("删除成功", { type: "success" });
    handleSearch();
  } catch (error) {
    message("删除失败", { type: "error" });
  }
};

onMounted(async () => {
  await handleSearch();
});
</script>

<template>
  <div class="main">
    <PlusSearch
      v-model="state"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="formColumns"
      :show-number="3"
      label-width="80"
      label-position="right"
      @change="handleChange"
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
            新增用户
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
                更新
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
.main {
  margin: 20px;
}

:deep(.el-card) {
  border: none;
  box-shadow: none;
}
</style>

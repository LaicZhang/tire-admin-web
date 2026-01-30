<script setup lang="ts">
import { ref, h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Eye from "~icons/ep/view";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import "plus-pro-components/es/components/search/style/css";
import { type PlusColumn, PlusSearch } from "plus-pro-components";
import { columns } from "./columns";
import {
  getOneUserApi,
  getUsersApi,
  addUserApi,
  updateUserApi,
  deleteUserApi,
  restoreUserApi,
  type UserDto,
  type CreateUserDto,
  type UpdateUserDto
} from "@/api/user";
import { PureTableBar } from "@/components/RePureTableBar";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import UserForm from "./form.vue";
import { message, handleApiError } from "@/utils";
import { FormItemProps } from "./utils/types";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";
import DeleteButton from "@/components/DeleteButton/index.vue";

defineOptions({
  name: "user"
});

const state = ref({
  scope: "nonDeleted" as "nonDeleted" | "deleted" | "all",
  status: "",
  username: ""
});
const formRef = ref();

const formColumns: PlusColumn[] = [
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

// 使用 useCrud composable 管理 CRUD 操作
const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  UserDto,
  CommonResult<{ list: UserDto[]; count: number }>,
  { page: number }
>({
  api: (params: { page: number }) =>
    getUsersApi(params.page, {
      scope: state.value.scope,
      username: state.value.username || undefined,
      status: state.value.status === "" ? undefined : state.value.status === "1"
    }),
  transform: (res: CommonResult<{ list: UserDto[]; count: number }>) => ({
    list: res.data?.list ?? [],
    total: res.data?.count ?? 0
  }),
  immediate: true
});

const handleChange = () => {
  handleSearch();
};

const handleSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

const handleReset = () => {
  state.value = { status: "", username: "" };
  handleSearch();
};

const getDetails = async (row: { uid: string }) => {
  loading.value = true;
  try {
    const { data } = await getOneUserApi(row.uid);
    const user = data as FormItemProps;
    loading.value = false;
    addDialog({
      title: "用户详情",
      props: {
        formInline: {
          uid: user.uid,
          username: user.username ?? "",
          phone: user.phone ?? "",
          email: user.email ?? "",
          status: user.status ?? "1"
        }
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: true,
      hideFooter: true,
      contentRenderer: ({ options }) =>
        h(UserForm, {
          ref: formRef,
          formInline: (options.props! as { formInline: FormItemProps })
            .formInline,
          disabled: true
        })
    });
  } catch (error) {
    loading.value = false;
    handleApiError(error, "获取用户详情失败");
  }
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
              ? addUserApi({
                  username: curData.username,
                  password: curData.password || "",
                  phone: curData.phone,
                  email: curData.email
                } as CreateUserDto)
              : updateUserApi(row?.uid ?? "", {
                  username: curData.username,
                  phone: curData.phone,
                  email: curData.email,
                  status: curData.status ? Number(curData.status) : undefined
                } as UpdateUserDto);

          promise
            .then(() => {
              message("操作成功", { type: "success" });
              done();
              fetchData();
            })
            .catch(error => {
              handleApiError(error, "操作失败");
            });
        }
      });
    }
  });
};

async function handleDelete(row: { uid: string; username: string }) {
  await deleteUserApi(row.uid);
  message(`您删除了${row.username}这条数据`, { type: "success" });
  fetchData();
}

async function handleRestore(row: { uid: string; username: string }) {
  await restoreUserApi(row.uid);
  message(`已恢复${row.username}`, { type: "success" });
  fetchData();
}
</script>

<template>
  <div class="m-[20px]">
    <PlusSearch
      v-model="state"
      class="bg-white mb-4 p-4 rounded-md"
      :columns="formColumns"
      :show-number="4"
      label-width="80"
      label-position="right"
      @change="handleChange"
      @search="handleSearch"
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
            新增用户
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            ref="tableRef"
            border
            adaptive
            row-key="uid"
            alignWhole="center"
            showOverflowTooltip
            :loading="loading"
            :size="size"
            :data="dataList"
            :columns="columns"
            :pagination="{ ...pagination, size }"
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
                v-if="!row.deleteAt"
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click.prevent="openDialog('修改', row)"
              >
                更新
              </el-button>
              <el-popconfirm
                v-if="row.deleteAt"
                :title="`确定要恢复用户 '${row.username}' 吗？`"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleRestore(row)"
              >
                <template #reference>
                  <el-button class="reset-margin" link type="primary">
                    恢复
                  </el-button>
                </template>
              </el-popconfirm>
              <DeleteButton
                v-if="!row.deleteAt"
                :title="`确定要删除用户 '${row.username}' 吗？`"
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

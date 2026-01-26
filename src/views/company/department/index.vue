<script setup lang="ts">
import { h, ref } from "vue";
import { columns } from "./columns";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import DeleteButton from "@/components/DeleteButton/index.vue";
import { openDialog } from "./table";
import { addDialog } from "@/components/ReDialog";
import {
  getDepartmentListApi,
  deleteDepartmentApi,
  getDepartmentRolesApi,
  setDepartmentRolesApi,
  removeDepartmentRolesApi
} from "@/api";
import type { Department } from "@/api/company/department";
import { getRolesApi } from "@/api/system/role";
import { message, handleApiError } from "@/utils";
import { BATCH_FETCH_PAGE_SIZE } from "@/utils/constants";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/composables/useCrud";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import RolesForm from "./RolesForm.vue";

defineOptions({
  name: "department"
});

const form = ref({
  name: undefined,
  desc: undefined
});

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud({
  api: async ({ page, pageSize, ...params }) => {
    const res = await getDepartmentListApi(page, { ...params, pageSize });
    if (res.code !== 200) throw new Error(res.msg);
    return res;
  },
  params: form,
  transform: ({ data }) => ({ list: data.list, total: data.count })
});

const onReset = () => {
  form.value = {
    name: undefined,
    desc: undefined
  };
  fetchData();
};

async function handleDelete(row: Department) {
  try {
    await deleteDepartmentApi(row.uid);
    message(`您删除了${row.name}这条数据`, { type: "success" });
    fetchData();
  } catch (e) {
    handleApiError(e, "删除部门失败");
  }
}

// 打开角色管理对话框
async function openRolesDialog(row: { uid: string; name: string }) {
  // 先加载数据
  let allRolesList: { uid: string; name: string }[] = [];
  let deptRolesList: string[] = [];
  let isLoading = true;

  try {
    const [rolesRes, deptRolesRes] = await Promise.all([
      getRolesApi(1, { pageSize: BATCH_FETCH_PAGE_SIZE }),
      getDepartmentRolesApi(row.uid)
    ]);

    if (rolesRes.code === 200) {
      allRolesList = rolesRes.data?.list || [];
    }
    if (deptRolesRes.code === 200) {
      deptRolesList = deptRolesRes.data || [];
    }
    isLoading = false;
  } catch {
    message("获取角色信息失败", { type: "error" });
    return;
  }

  // 用于追踪选中的角色
  let selectedRolesList = [...deptRolesList];

  addDialog({
    title: `管理部门角色 - ${row.name}`,
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    props: {
      allRoles: allRolesList,
      selectedRoles: selectedRolesList,
      loading: isLoading
    },
    contentRenderer: ({ options }) =>
      h(RolesForm, {
        allRoles: (options.props as { allRoles: typeof allRolesList }).allRoles,
        selectedRoles: (options.props as { selectedRoles: string[] })
          .selectedRoles,
        loading: (options.props as { loading: boolean }).loading,
        "onUpdate:selectedRoles": (val: string[]) => {
          selectedRolesList = val;
        }
      }),
    beforeSure: async done => {
      try {
        // 计算需要添加和删除的角色
        const toAdd = selectedRolesList.filter(
          (r: string) => !deptRolesList.includes(r)
        );
        const toRemove = deptRolesList.filter(
          (r: string) => !selectedRolesList.includes(r)
        );

        // 添加新角色
        if (toAdd.length > 0) {
          await setDepartmentRolesApi(row.uid, toAdd);
        }

        // 移除角色
        if (toRemove.length > 0) {
          await removeDepartmentRolesApi(row.uid, toRemove);
        }

        message("角色分配保存成功", { type: "success" });
        done();
      } catch {
        message("保存失败", { type: "error" });
      }
    }
  });
}
</script>

<template>
  <div class="main">
    <ReSearchForm
      :form="form"
      :loading="loading"
      @search="fetchData"
      @reset="onReset"
    >
      <el-form-item label="名称：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入部门名称"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="备注：" prop="desc">
        <el-input
          v-model="form.desc"
          placeholder="请输入备注"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
    </ReSearchForm>

    <el-card class="m-1">
      <PureTableBar :title="$route.meta.title" @refresh="fetchData">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            新增部门
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size
            :columns
            border
            :data="dataList"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-size-change="onSizeChange"
            @page-current-change="onCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                @click="openDialog('查看', row)"
              >
                查看
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
              <el-button
                class="reset-margin"
                link
                type="warning"
                @click="openRolesDialog(row)"
              >
                角色
              </el-button>
              <DeleteButton
                :title="`是否确认删除${row.name}这条数据`"
                :show-icon="false"
                @confirm="handleDelete(row)"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>
